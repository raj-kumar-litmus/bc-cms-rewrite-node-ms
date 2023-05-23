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

// Endpoint to create a workflow
router.post('/', validateMiddleware({ body: createWorkflowDto }), async (req, res) => {
  try {
    const {
      body: { styles }
    } = req;

    const createdWorkflows = [];
    const failedWorkflows = [];

    await Promise.all(
      styles.map(async ({ styleId, brand, title }) => {
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
          failed: failedWorkflows
        },
        207
      );
    }

    return res.sendResponse({ success: createdWorkflows }, 201);
  } catch (error) {
    console.error(error);
    return res.sendResponse('An error occurred while creating the workflows.', 500);
  } finally {
    await prisma.$disconnect();
  }
});

// Endpoint to search workflows
router.post(
  '/search',
  validateMiddleware({
    query: searchWorkflowQueryDto,
    body: searchWorkflowBodyDto
  }),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, unique, globalSearch } = req.query;
      const { filters = {}, orderBy = {} } = req.body;
      const parsedLimit = parseInt(limit, 10);
      const parsedPage = parseInt(page, 10);

      if (Number.isNaN(parsedLimit) || Number.isNaN(parsedPage)) {
        return res.sendResponse('Invalid page or limit value.', 400);
      }

      const skip = (parsedPage - 1) * parsedLimit;

      const where = {};

      if (globalSearch) {
        where.OR = [
          { styleId: { contains: globalSearch, mode: 'insensitive' } },
          { brand: { contains: globalSearch, mode: 'insensitive' } },
          { title: { contains: globalSearch, mode: 'insensitive' } }
        ];
      } else {
        Object.entries(filters).forEach(([param, values]) => {
          if (param === 'lastUpdateTs') {
            const date = new Date(values);
            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));

            where[param] = {
              gte: startOfDay.toISOString(),
              lt: endOfDay.toISOString()
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
      }

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
      return res.sendResponse('An error occurred while searching workflows.', 500);
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
          OR: [{ status: Status.ASSIGNED_TO_WRITER }, { status: Status.ASSIGNED_TO_EDITOR }]
        }
      }),
      inProgress: await prisma.workflow.count({
        where: {
          OR: [{ status: Status.WRITING_IN_PROGRESS }, { status: Status.EDITING_IN_PROGRESS }]
        }
      }),
      completed: await prisma.workflow.count({
        where: {
          OR: [{ status: Status.WRITING_COMPLETE }, { status: Status.EDITING_COMPLETE }]
        }
      })
    };

    return res.sendResponse(counts);
  } catch (error) {
    console.error(error);
    return res.sendResponse('An error occurred while fetching workflow counts.', 500);
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

    if (error.code === 'P2023' && error.meta?.message?.includes('Malformed ObjectID')) {
      return res.sendResponse('Invalid workflow ID.', 400);
    }

    return res.sendResponse('An error occurred while retrieving the workflow.', 500);
  } finally {
    await prisma.$disconnect();
  }
});

// Update workflow status and assign writer or editor
router.patch('/:id', validateMiddleware({ body: updatedWorkflowDto }), async (req, res) => {
  try {
    const { id } = req.params;
    const { ...updatedFields } = req.body;

    // Find the workflow by ID
    const workflow = await prisma.workflow.findUnique({
      where: {
        id
      }
    });

    if (!workflow) {
      return res.sendResponse('Workflow not found.', 404);
    }

    try {
      const changeLog = workflowEngine(workflow, updatedFields);

      changeLog.lastUpdatedBy = 'temp user';

      const updatedWorkflow = await prisma.workflow.update({
        where: {
          id
        },
        data: changeLog
      });

      return res.sendResponse({ workflow: updatedWorkflow, changeLog });
    } catch (error) {
      console.error(error);
      return res.sendResponse(error.message, 400);
    }
  } catch (error) {
    console.error(error);
    return res.sendResponse('An error occurred while updating the workflow.', 500);
  } finally {
    await prisma.$disconnect();
  }
});

// Endpoint to delete a workflow
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.workflow.delete({
      where: {
        styleId: id
      }
    });

    return res.sendResponse(
      {
        message: 'Workflow deleted successfully.'
      },
      200
    );
  } catch (error) {
    console.error(error);
    return res.sendResponse('An error occurred while deleting the workflow.', 500);
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = router;
