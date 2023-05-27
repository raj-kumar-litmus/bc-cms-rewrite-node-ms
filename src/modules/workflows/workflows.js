const express = require('express');
const { PrismaClient } = require('@prisma/client');

const workflowEngine = require('./workflowEngine');
const { validateMiddleware } = require('../../middlewares');
const { CreateProcess, Status } = require('./enums');
const { whereBuilder } = require('./utils');
const {
  createWorkflowDto,
  assignWorkflowDto,
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

      let where = {};

      if (globalSearch) {
        where.OR = [
          { styleId: { contains: globalSearch, mode: 'insensitive' } },
          { brand: { contains: globalSearch, mode: 'insensitive' } },
          { title: { contains: globalSearch, mode: 'insensitive' } }
        ];
      } else {
        where = whereBuilder(filters);
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
// const { id, workflowId: wID, createTs,createdBy, ...rest } = WorkflowAuditLogKeysEnum;

router.get('/:workflowId/auditLog', async (req, res) => {
  try {
    const { workflowId } = req.params;

    const auditLogs = await prisma.workbenchAudit.findMany({
      where: {
        workflowId
      }
    });

    res.sendResponse(auditLogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
});

// Update workflows status and assign writer or editor
router.patch('/assign', validateMiddleware({ body: assignWorkflowDto }), async (req, res) => {
  try {
    const {
      filters,
      assignments: { writer, editor }
    } = req.body;

    let where = whereBuilder(filters);

    const distinctStatuses = (
      await prisma.workflow.findMany({
        distinct: ['status'],
        select: {
          status: true
        },
        where
      })
    )?.map(({ status }) => status);

    let updateCount = 0;
    const errors = [];
    const auditLogs = [];

    for (const status of distinctStatuses) {
      where = { ...where, status };
      const workflows = await prisma.workflow.findMany({ where, take: 1 });
      try {
        const changeLog = workflowEngine(workflows[0], { writer, editor });

        if (Object.keys(changeLog).length > 0) {
          const { count } = await prisma.workflow.updateMany({
            data: {
              ...changeLog,
              lastUpdatedBy: 'admin'
            },
            where
          });

          updateCount += count;
        }

        const workflowAuditLogs = workflows.map((workflow) => ({
          workflowId: workflow.id,
          ...changeLog,
          createdBy: 'admin'
        }));

        auditLogs.push(...workflowAuditLogs);
      } catch (error) {
        errors.push({
          filters: { ...filters, status },
          error: error.message
        });
      }
    }

    if (updateCount > 0) {
      if (auditLogs.length > 0) {
        await prisma.workbenchAudit.createMany({
          data: auditLogs
        });
      }

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
        400
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
