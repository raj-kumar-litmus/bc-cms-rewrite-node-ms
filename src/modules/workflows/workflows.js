const express = require('express');

const { transformObject } = require('../../utils');
const { validateMiddleware } = require('../../middlewares');
const { mongoPrisma } = require('../prisma');
const workflowEngine = require('./workflowEngine');
const { CreateProcess, Status } = require('./enums');
const { whereBuilder } = require('./utils');
const {
  createWorkflowDto,
  assignWorkflowDto,
  searchWorkflowQueryDto,
  searchWorkflowBodyDto
} = require('./dtos');

const router = express.Router();

// Endpoint to create a workflow
router.post('/', validateMiddleware({ body: createWorkflowDto }), async (req, res) => {
  try {
    const {
      body: { styles },
      query: { email = 'pc.admin@backCountry.com' }
    } = req;

    const createdWorkflows = [];
    const failedWorkflows = [];

    await Promise.all(
      styles.map(async ({ styleId, brand, title }) => {
        try {
          const transformedData = transformObject(
            {
              styleId,
              brand,
              title,
              createProcess: CreateProcess.WRITER_INTERFACE,
              admin: email,
              lastUpdatedBy: email
            },
            {
              styleId: 'upperCase',
              brand: 'lowerCase',
              title: 'lowerCase',
              admin: 'lowerCase',
              lastUpdatedBy: 'lowerCase'
            }
          );

          const workflow = await mongoPrisma.workflow.create({
            data: transformedData
          });
          createdWorkflows.push(workflow);
        } catch (error) {
          console.log(error);
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
    await mongoPrisma.$disconnect();
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
      const { page = 1, limit = 10, unique } = req.query;
      const { filters = {}, orderBy = {} } = req.body;
      const parsedLimit = parseInt(limit, 10);
      const parsedPage = parseInt(page, 10);

      if (Number.isNaN(parsedLimit) || Number.isNaN(parsedPage)) {
        return res.sendResponse('Invalid page or limit value.', 400);
      }

      const skip = (parsedPage - 1) * parsedLimit;

      const where = whereBuilder(filters);

      let workflows;
      let total = 0;
      let uniqueValues;

      if (unique) {
        [uniqueValues, total] = await Promise.all([
          mongoPrisma.workflow.findMany({
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
          mongoPrisma.workflow
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
          mongoPrisma.workflow.findMany({
            where,
            orderBy,
            skip,
            take: parsedLimit
          }),
          mongoPrisma.workflow.count({ where })
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
      await mongoPrisma.$disconnect();
    }
  }
);

// Endpoint to retrieve workflow counts
router.get('/counts', async (req, res) => {
  try {
    const { email } = req.query;

    const counts = {
      unassigned: await mongoPrisma.workflow.count({
        where: { status: Status.WAITING_FOR_WRITER }
      }),
      assigned: await mongoPrisma.workflow.count({
        where: {
          OR: [
            { status: Status.ASSIGNED_TO_WRITER, assignee: email },
            { status: Status.ASSIGNED_TO_EDITOR, assignee: email }
          ]
        }
      }),
      inProgress: await mongoPrisma.workflow.count({
        where: {
          OR: [
            { status: Status.WRITING_IN_PROGRESS, assignee: email },
            { status: Status.EDITING_IN_PROGRESS, assignee: email }
          ]
        }
      }),
      completed: await mongoPrisma.workflow.count({
        where: {
          OR: [
            { status: Status.WRITING_COMPLETE, assignee: email },
            { status: Status.EDITING_COMPLETE, assignee: email }
          ]
        }
      })
    };

    return res.sendResponse(counts);
  } catch (error) {
    console.error(error);
    return res.sendResponse('An error occurred while fetching workflow counts.', 500);
  } finally {
    await mongoPrisma.$disconnect();
  }
});

// Endpoint to retrieve a specific workflow
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await mongoPrisma.workflow.findUnique({
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
    await mongoPrisma.$disconnect();
  }
});

// Endpoint to retrieve a specific workflow's history
router.get('/:workflowId/history', async (req, res) => {
  try {
    const { workflowId } = req.params;

    const auditLogs = await mongoPrisma.workbenchAudit.findMany({
      where: {
        workflowId
      },
      orderBy: {
        createTs: 'desc'
      }
    });

    const filteredData = auditLogs.map((log) => {
      const filteredLog = {};
      Object.entries(log).forEach(([key, value]) => {
        if (key !== 'workflowId' && value !== null) {
          filteredLog[key] = value;
        }
      });
      return filteredLog;
    });

    return res.sendResponse(filteredData);
  } catch (error) {
    console.error(error);
    return res.sendResponse('An error occurred while getting workflow history.', 500);
  } finally {
    await mongoPrisma.$disconnect();
  }
});

// Update workflows status and assign writer or editor
router.patch('/assign', validateMiddleware({ body: assignWorkflowDto }), async (req, res) => {
  try {
    const {
      filters: { excludeIds, ...filters },
      assignments: { writer, editor }
    } = req.body;

    const { email } = req.query;

    let where = whereBuilder(filters);

    const distinctStatuses = (
      await mongoPrisma.workflow.findMany({
        distinct: ['status'],
        select: {
          status: true
        },
        where
      })
    )?.map(({ status }) => status);

    let updateCount = 0;
    const errors = [];

    for await (const status of distinctStatuses) {
      where = { ...where, status };
      const workflows = await mongoPrisma.workflow.findMany({ where, take: 1 });

      try {
        const changeLog = workflowEngine(workflows[0], { writer, editor });

        if (Object.keys(changeLog).length > 0) {
          const transformedData = transformObject(
            {
              ...changeLog,
              lastUpdatedBy: email
            },
            {
              writer: 'lowerCase',
              editor: 'lowerCase',
              assignee: 'lowerCase',
              lastUpdatedBy: 'lowerCase'
            }
          );

          const { count } = await mongoPrisma.workflow.updateMany({
            data: transformedData,
            where
          });

          updateCount += count;
        }
      } catch (error) {
        errors.push({
          filters: { ...filters, status },
          error: error.message
        });
      }
    }

    if (updateCount > 0) {
      return res.sendResponse(
        {
          message: `${updateCount} workflow${updateCount !== 1 ? 's' : ''} updated successfully`,
          errors: errors.length ? errors : undefined
        },
        errors.length ? 207 : 200
      );
    }

    if (errors.length > 0) {
      return res.sendResponse(
        {
          message: 'Errors occurred while updating workflows',
          errors
        },
        207
      );
    }

    return res.sendResponse(
      {
        message: 'No workflows found for updating.'
      },
      404
    );
  } catch (error) {
    console.error(error);
    return res.sendResponse('An error occurred while updating the workflows.', 500);
  } finally {
    await mongoPrisma.$disconnect();
  }
});

// Endpoint to delete a workflow
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await mongoPrisma.workflow.delete({
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
    await mongoPrisma.$disconnect();
  }
});

module.exports = router;
