const express = require('express');

const { transformObject } = require('../../utils');
const { validateMiddleware } = require('../../middlewares');
const { mongoPrisma } = require('../prisma');
const workflowEngine = require('./workflowEngine');
const { CreateProcess, Status } = require('./enums');
const { whereBuilder, deepCompare } = require('./utils');
const {
  assignWorkflowDto,
  createWorkflowDto,
  searchWorkflowBodyDto,
  searchWorkflowQueryDto,
  workflowDetailsDto
} = require('./dtos');

const router = express.Router();

const findWorkflowById = async (id) => {
  try {
    const workflow = await mongoPrisma.workflow.findUnique({
      where: {
        id
      }
    });

    if (!workflow) throw new Error('Workflow not found.', 404);

    return workflow;
  } catch (error) {
    console.error(error);

    if (error.code === 'P2023' && error.meta?.message?.includes('Malformed ObjectID')) {
      throw new Error('Invalid workflow ID.');
    }

    throw new Error('An error occurred while retrieving the workflow.');
  } finally {
    await mongoPrisma.$disconnect();
  }
};

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

          const workflowDetails = await mongoPrisma.workbenchAudit.create({
            data: {
              genus: 'Climbing accessories',
              species: 'Belay Devices',
              harmonizingData: {
                recommendedUse: ['Ice climbing', 'Mountaineering'],
                ropeDiameter: ['<9.5mm'],
                type: ['Figure 8']
              },
              techspecs: {
                responsibleCollection: 'Value1',
                material: 'Value2'
              },
              productTitle: 'My product title',
              topLine: 'The top line',
              detailedDescription: 'Detailed desc val1',
              listDescription: 'My list of desc',
              bulletPoints: 'bullet points 123',
              sizingChart: 'my sizing chart',
              competitiveCyclistTopline: 'top line 33',
              competitiveCyclistDescription: 'desc 123 1',
              createdBy: email,
              versionReason: 'Editing',
              isPublished: false,
              workflowId: workflow.id
            }
          });

          createdWorkflows.push({ workflow, workflowDetails });
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
        // revisit this
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
      const { page = 1, limit = 10, unique, globalSearch } = req.query;
      const { filters = {}, orderBy = {} } = req.body;
      const parsedLimit = parseInt(limit, 10);
      const parsedPage = parseInt(page, 10);

      if (Number.isNaN(parsedLimit) || Number.isNaN(parsedPage)) {
        return res.sendResponse('Invalid page or limit value.', 400);
      }

      const skip = (parsedPage - 1) * parsedLimit;

      const where = whereBuilder(filters);

      if (globalSearch) {
        where.OR = [
          { styleId: { contains: globalSearch, mode: 'insensitive' } },
          { brand: { contains: globalSearch, mode: 'insensitive' } },
          { title: { contains: globalSearch, mode: 'insensitive' } }
        ];
      }

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
    const workflow = await findWorkflowById(id);
    const workflowDeatils = await mongoPrisma.workbenchAudit.findFirst({
      where: {
        workflowId: id
      }
    });

    res.sendResponse({ workflow, workflowDeatils });
  } catch (error) {
    console.error(error);

    res.sendResponse(error.message, error.status || 500);
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
    return res.sendResponse("An error occurred while getting workflow's history.", 500);
  } finally {
    await mongoPrisma.$disconnect();
  }
});

// Endpoint to retrieve a specific workflow history
router.get('/:workflowId/history/:historyId', async (req, res) => {
  try {
    const { workflowId, historyId } = req.params;

    const auditLog = await mongoPrisma.workbenchAudit.findUnique({
      where: {
        id: historyId,
        workflowId
      },
      orderBy: {
        createTs: 'desc'
      }
    });

    if (!auditLog) return res.sendResponse('AuditLog not found.', 404);

    const filteredLog = {};
    Object.entries(auditLog).forEach(([key, value]) => {
      if (key !== 'workflowId' && value !== null) {
        filteredLog[key] = value;
      }
    });

    return res.sendResponse(filteredLog);
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

    const { email = 'pc.admin@backcountry.com' } = req.query;

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
    const auditLogs = [];

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

        const workflowAuditLogs = workflows.map((workflow) => ({
          workflowId: workflow.id,
          ...changeLog,
          createdBy: email
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
        await mongoPrisma.workbenchAudit.createMany({
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
    await mongoPrisma.$disconnect();
  }
});

// Endpoint to save a snapshot of a workflow for later audit log
router.patch('/:workflowId', validateMiddleware({ body: workflowDetailsDto }), async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { email = 'pc.editor@backcountry.com' } = req.query;
    const workflow = await findWorkflowById(workflowId);

    const currentSnapshot = req.body;

    const { isPublished } = currentSnapshot;

    let changeLog = workflowEngine(workflow, { isPublished });

    if (Object.keys(currentSnapshot).length === 0 && Object.keys(changeLog).length === 0) {
      res.sendResponse('No changes detected. Nothing to save.', 400);
      return;
    }

    if (Object.keys(changeLog).length) {
      changeLog = transformObject(
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

      await mongoPrisma.workflow.update({
        data: changeLog,
        where: {
          id: workflow.id
        }
      });
    }

    if (Object.keys(currentSnapshot).length) {
      const previousSnapshot = await mongoPrisma.workbenchAudit.findFirst({
        where: {
          workflowId
        },
        orderBy: {
          createTs: 'desc'
        }
      });

      const diff = deepCompare(previousSnapshot, currentSnapshot, [
        'changeLog',
        'id',
        'createTs',
        'createdBy',
        'workflowId'
      ]);

      changeLog = { ...changeLog, ...diff };
    }

    if (Object.keys(changeLog).length === 0) {
      res.sendResponse('No changes detected. Nothing to save.', 400);
      return;
    }

    await mongoPrisma.workbenchAudit.create({
      data: {
        workflowId,
        createdBy: email,
        ...currentSnapshot,
        changeLog
      }
    });

    res.sendResponse({
      workflowId,
      createdBy: email,
      ...currentSnapshot,
      changeLog
    });
  } catch (error) {
    console.error(error);

    res.sendResponse(
      error.message || 'An error occurred while saving workflow for later',
      error.status || 500
    );
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
