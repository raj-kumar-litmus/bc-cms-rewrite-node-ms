const express = require('express');
const { PrismaClient } = require('@prisma/client');

const workflowEngine = require('./workflowEngine');
const { validateMiddleware } = require('../../middlewares');
const { CreateProcess, Status } = require('./enums');
const {
  createWorkflowDto,
  updatedWorkflowDto,
  searchWorkflowQueryDto,
  searchWorkflowBodyDto
} = require('./dtos');

const router = express.Router();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

// // Endpoint to initiate a workflow exsting Workflows
// router.post('/', validateMiddleware(createWorkflowDto), async (req, res) => {
//   try {
//     const {
//       body: { styles }
//     } = req;

//     // Validating styleId
//     const validStyles = [];
//     const invalidStyles = [];

//     styles.forEach(({ styleId, brand, title }) => {
//       if (styleId.length < 6) {
//         invalidStyles.push(styleId);
//       } else {
//         validStyles.push({ styleId, brand, title });
//       }
//     });

//     const existingWorkflows = await prisma.workflow.findMany({
//       where: {
//         styleId: {
//           in: validStyles.map(({ styleId }) => styleId),
//           mode: 'insensitive'
//         }
//         // status: {
//         //   not: Status.EDITING_COMPLETE
//         // }
//       }
//     });

//     const existingStyles = existingWorkflows.map(({ styleId }) => styleId);

//     const nonExistingStyles = validStyles.filter(
//       ({ styleId }) => !existingStyles.includes(styleId.toUpperCase())
//     );

//     if (!nonExistingStyles.length) {
//       return res.sendResponse(
//         {
//           success: [],
//           invalid: invalidStyles,
//           existing: existingStyles
//         },
//         201
//       );
//     }

//     const { count: createdCount } = await prisma.workflow.createMany({
//       data: nonExistingStyles.map(({ styleId, brand, title }) => ({
//         styleId: styleId.toUpperCase(),
//         brand,
//         title,
//         createProcess: CreateProcess.WRITER_INTERFACE,
//         admin: 'admin user',
//         lastUpdatedBy: 'admin user'
//       }))
//     });

//     const totalCount = nonExistingStyles.length;

//     if (createdCount !== totalCount) {
//       return res.sendResponse('Some records failed to insert.', 207);
//     }

//     return res.sendResponse(
//       {
//         success: nonExistingStyles.map(({ styleId }) => styleId),
//         invalid: invalidStyles,
//         existing: existingStyles
//       },
//       201
//     );
//   } catch (error) {
//     console.error(error);
//     if (error instanceof Prisma.PrismaClientKnownRequestError) {
//       if (error.code === 'P2002') {
//         return res.sendResponse(
//           'There is a unique constraint violation, a workflow cannot be created with this styleId',
//           409
//         );
//       }
//       return res.sendResponse(
//         'An error occurred while creating the workflow.',
//         500
//       );
//     }
//     return res.sendResponse(
//       'An error occurred while creating the workflow.',
//       500
//     );
//   } finally {
//     await prisma.$disconnect();
//   }
// });

// Endpoint to initiate a workflow
router.post(
  '/',
  validateMiddleware({ body: createWorkflowDto }),
  async (req, res) => {
    try {
      const {
        body: { styles }
      } = req;

      const validStyles = [];
      const invalidStyles = [];
      const createdWorkflows = [];
      const failedWorkflows = [];

      styles.forEach(({ styleId, brand, title }) => {
        // Check the necessity
        if (styleId.length < 6) {
          invalidStyles.push(styleId);
        } else {
          validStyles.push({ styleId, brand, title });
        }
      });

      await Promise.all(
        validStyles.map(async ({ styleId, brand, title }) => {
          try {
            const workflow = await prisma.workflow.create({
              data: {
                styleId: styleId.toUpperCase(),
                brand,
                title,
                createProcess: CreateProcess.WRITER_INTERFACE,
                admin: 'admin user',
                lastUpdatedBy: 'admin user'
              }
            });
            createdWorkflows.push(workflow);
          } catch (error) {
            failedWorkflows.push({ styleId, brand, title });
          }
        })
      );

      if (failedWorkflows.length > 0) {
        return res.sendResponse(
          {
            success: createdWorkflows,
            failed: failedWorkflows,
            invalid: invalidStyles
          },
          207
        );
      }

      return res.sendResponse(
        {
          success: createdWorkflows,
          invalid: invalidStyles
        },
        201
      );
    } catch (error) {
      console.error(error);
      return res.sendResponse(
        'An error occurred while creating the workflows.',
        500
      );
    } finally {
      await prisma.$disconnect();
    }
  }
);

// Endpoint to search workflows
router.post(
  '/search',
  validateMiddleware({
    query: searchWorkflowQueryDto,
    body: searchWorkflowBodyDto
  }),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, unique } = req.query;
      const { filters = {}, orderBy = {} } = req.body;
      const parsedLimit = parseInt(limit, 10);
      const parsedPage = parseInt(page, 10);

      if (Number.isNaN(parsedLimit) || Number.isNaN(parsedPage)) {
        return res.sendResponse('Invalid page or limit value.', 400);
      }

      const skip = (parsedPage - 1) * parsedLimit;

      const where = {};

      Object.entries(filters).forEach(([param, values]) => {
        if (param === 'lastUpdateTs') {
          const date = new Date(values);
          const startOfDay = new Date(date.setHours(0, 0, 0, 0));
          const endOfDay = new Date(date.setHours(23, 59, 59, 999));

          where[param] = {
            gte: startOfDay.toISOString(),
            lt: endOfDay.toISOString()
          };
        } else if (param === 'assignee') {
          where[param] = {
            OR: [
              { writer: { in: values, mode: 'insensitive' } },
              { editor: { in: values, mode: 'insensitive' } }
            ]
          };
        } else if (Array.isArray(values)) {
          where[param] = {
            in: values,
            mode: param === 'status' ? undefined : 'insensitive'
          };
        } else {
          where[param] = {
            contains: values,
            mode: 'insensitive'
          };
        }
      });

      let workflows;
      let total = 0;
      let uniqueValues;

      if (unique) {
        [uniqueValues, total] = await Promise.all([
          prisma.workflow.findMany({
            distinct: [unique],
            select: {
              [unique]: true
            },
            where,
            skip,
            orderBy: {
              [unique]: 'asc'
            },
            take: parsedLimit
          }),
          prisma.workflow
            .findMany({
              distinct: [unique],
              select: {
                [unique]: true
              },
              where
            })
            .then((result) => result.length)
            .catch(() => 0) // Set the default count to 0 in case of errors
        ]);
      } else {
        [workflows, total] = await Promise.all([
          prisma.workflow.findMany({
            where,
            orderBy,
            skip,
            take: parsedLimit
          }),
          prisma.workflow.count({ where })
        ]);
        workflows.forEach((workflow) => {
          const workflowWithAssignee = { ...workflow };
          if (
            [
              'ASSIGNED_TO_WRITER',
              'WRITING_IN_PROGRESS',
              'WRITING_COMPLETE'
            ].includes(workflow.status)
          ) {
            workflowWithAssignee.assignee = workflow.writer;
          } else if (
            [
              'ASSIGNED_TO_EDITOR',
              'EDITING_IN_PROGRESS',
              'EDITING_COMPLETE'
            ].includes(workflow.status)
          ) {
            workflowWithAssignee.assignee = workflow.editor;
          } else {
            workflowWithAssignee.assignee = null;
          }
          return workflowWithAssignee;
        });
      }

      const pageCount = Math.ceil(total / parsedLimit);
      const currentPageCount = unique ? uniqueValues.length : workflows.length;

      return res.sendResponse({
        workflows,
        uniqueValues: uniqueValues?.map((obj) => obj[unique]),
        pagination: {
          total,
          pageCount,
          currentPage: parsedPage,
          currentPageCount
        }
      });
    } catch (error) {
      console.error(error);
      return res.sendResponse(
        'An error occurred while searching workflows.',
        500
      );
    } finally {
      await prisma.$disconnect();
    }
  }
);

// Endpoint to retrieve workflow counts
router.get('/counts', async (req, res) => {
  try {
    const counts = {
      unassigned: await prisma.workflow.count({
        where: { status: Status.WAITING_FOR_WRITER }
      }),
      assigned: await prisma.workflow.count({
        where: {
          OR: [
            { status: Status.ASSIGNED_TO_WRITER },
            { status: Status.WRITING_IN_PROGRESS },
            { status: Status.WRITING_COMPLETE },
            { status: Status.ASSIGNED_TO_EDITOR },
            { status: Status.EDITING_IN_PROGRESS },
            { status: Status.EDITING_COMPLETE }
          ]
        }
      }),
      inProgress: await prisma.workflow.count({
        where: {
          OR: [
            { status: Status.ASSIGNED_TO_WRITER },
            { status: Status.WRITING_IN_PROGRESS },
            { status: Status.WRITING_COMPLETE },
            { status: Status.ASSIGNED_TO_EDITOR },
            { status: Status.EDITING_IN_PROGRESS },
            { status: Status.EDITING_COMPLETE }
          ]
        }
      }),
      completed: await prisma.workflow.count({
        where: {
          status: Status.EDITING_COMPLETE
        }
      })
    };

    return res.sendResponse(counts);
  } catch (error) {
    console.error(error);
    return res.sendResponse(
      'An error occurred while fetching workflow counts.',
      500
    );
  } finally {
    await prisma.$disconnect();
  }
});

// Endpoint to retrieve a specific workflow
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await prisma.workflow.findUnique({
      where: {
        id
      }
    });

    return res.sendResponse(workflow);
  } catch (error) {
    console.error(error);

    if (
      error.code === 'P2023' &&
      error.meta?.message?.includes('Malformed ObjectID')
    ) {
      return res.sendResponse('Invalid workflow ID.', 400);
    }

    return res.sendResponse(
      'An error occurred while retrieving the workflow.',
      500
    );
  } finally {
    await prisma.$disconnect();
  }
});

// Update workflow status and assign user API
router.patch(
  '/:id',
  validateMiddleware(updatedWorkflowDto),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { ...updatedFields } = req.body;

      // Find the workflow by ID
      const workflow = await prisma.workflow.findUnique({
        where: {
          styleId: id.toUpperCase()
        }
      });

      if (!workflow) {
        return res.sendResponse('Workflow not found.', 404);
      }

      try {
        workflowEngine(workflow, updatedFields);
      } catch (error) {
        console.error(error);
        return res.sendResponse(
          error.message || 'Invalid state transition.',
          400
        );
      }

      // Update the workflow in the database
      const updatedWorkflow = await prisma.workflow.update({
        where: {
          styleId: id.toUpperCase()
        },
        data: workflow
      });

      return res.sendResponse(updatedWorkflow);
    } catch (error) {
      console.error(error);
      return res.sendResponse(
        'An error occurred while updating the workflow.',
        500
      );
    } finally {
      await prisma.$disconnect();
    }
  }
);

// Endpoint to delete a workflow
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.workflow.delete({
      where: {
        styleId: id
      }
    });

    return res.sendResponse({
      message: 'Workflow deleted successfully.'
    });
  } catch (error) {
    console.error(error);
    return res.sendResponse(
      'An error occurred while deleting the workflow.',
      500
    );
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = router;
