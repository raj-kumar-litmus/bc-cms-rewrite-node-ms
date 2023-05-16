const express = require('express');
const { PrismaClient, Prisma } = require('@prisma/client');

const { validateMiddleware } = require('../../middlewares');
const { CreateProcess } = require('./enums');
const { createWorkflowDto, updatedWorkflowDto } = require('./dtos');

const router = express.Router();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

const validWorkflowColumns = ['brand', 'styleId', 'title'];

// Endpoint to initiate a workflow
router.post('/', validateMiddleware(createWorkflowDto), async (req, res) => {
  try {
    const {
      body: { styles }
    } = req;

    // Validating styleId
    const validStyles = [];
    const invalidStyles = [];

    styles.forEach(({ styleId, brand, title }) => {
      if (styleId.length < 6) {
        invalidStyles.push(styleId);
      } else {
        validStyles.push({ styleId, brand, title });
      }
    });

    const existingWorkflows = await prisma.workflow.findMany({
      where: {
        styleId: {
          in: validStyles.map(({ styleId }) => styleId),
          mode: 'insensitive'
        }
      }
    });

    const duplicateStyles = existingWorkflows.map(({ styleId }) => styleId);

    const nonDuplicateStyles = validStyles.filter(
      ({ styleId }) => !duplicateStyles.includes(styleId.toUpperCase())
    );

    if (!nonDuplicateStyles.length) {
      return res.sendResponse(
        {
          success: [],
          invalid: invalidStyles,
          duplicates: duplicateStyles
        },
        201
      );
    }

    const { count: createdCount } = await prisma.workflow.createMany({
      data: nonDuplicateStyles.map(({ styleId, brand, title }) => ({
        styleId: styleId.toUpperCase(),
        brand,
        title,
        createProcess: CreateProcess.WRITER_INTERFACE
      }))
    });

    const totalCount = nonDuplicateStyles.length;

    if (createdCount !== totalCount) {
      return res.sendResponse('Some records failed to insert.', 207);
    }

    return res.sendResponse(
      {
        success: nonDuplicateStyles.map(({ styleId }) => styleId),
        invalid: invalidStyles,
        duplicates: duplicateStyles
      },
      201
    );
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.sendResponse(
          'There is a unique constraint violation, a workflow cannot be created with this styleId',
          409
        );
      }
      return res.sendResponse(
        'An error occurred while creating the workflow.',
        500
      );
    }
    return res.sendResponse(
      'An error occurred while creating the workflow.',
      500
    );
  } finally {
    await prisma.$disconnect();
  }
});

// Endpoint to search workflows
router.get('/search', async (req, res) => {
  try {
    const { page = 1, limit = 10, ...filters } = req.query;
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);

    if (Number.isNaN(parsedLimit) || Number.isNaN(parsedPage)) {
      return res.status(400).json({ error: 'Invalid page or limit value.' });
    }

    const skip = (parsedPage - 1) * parsedLimit;

    const where = {};

    Object.keys(filters).forEach((param) => {
      if (validWorkflowColumns.includes(param)) {
        where[param] = {
          contains: filters[param],
          mode: 'insensitive'
        };
      } else {
        console.warn(`Ignoring unknown filter parameter: ${param}`);
      }
    });

    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        skip,
        take: parsedLimit
      }),
      prisma.workflow.count({ where })
    ]);

    const pageCount = Math.ceil(total / parsedLimit);
    const currentPageCount = workflows.length;

    return res.sendResponse({
      workflows,
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
});

// Endpoint to retrieve all workflows
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    const skip = (parsedPage - 1) * limit;

    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        skip,
        take: parsedLimit
      }),
      prisma.workflow.count()
    ]);

    const pageCount = Math.ceil(total / parsedLimit);
    const currentPageCount = workflows.length;

    return res.sendResponse({
      workflows,
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
      'An error occurred while retrieving the workflows.',
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
        styleId: id.toUpperCase()
      }
    });

    if (!workflow) {
      return res.sendResponse('Workflow not found.', 404);
    }

    return res.sendResponse(workflow);
  } catch (error) {
    console.error(error);
    return res.sendResponse(
      'An error occurred while retrieving the workflow.',
      500
    );
  } finally {
    await prisma.$disconnect();
  }
});

// Endpoint to update a workflow
router.patch(
  '/:id',
  validateMiddleware(updatedWorkflowDto),
  async (req, res) => {
    try {
      const {
        params: { id },
        body: data
      } = req;

      const updatedWorkflow = await prisma.workflow.update({
        where: {
          styleId: id.toUpperCase()
        },
        data
      });

      return res.sendResponse(updatedWorkflow);
    } catch (error) {
      console.error(error);

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return res.sendResponse('Workflow not found.', 404);
      }

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

    return res.sendResponse({ message: 'Workflow deleted successfully.' });
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
