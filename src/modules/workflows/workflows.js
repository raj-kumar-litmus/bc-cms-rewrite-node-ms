const express = require('express');
const { PrismaClient, Prisma } = require('@prisma/client');

const { validateMiddleware } = require('../../middlewares');
const { CreateProcess } = require('./enums');
const { createWorkflowDto, updatedWorkflowDto } = require('./dtos');

const router = express.Router();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

// Endpoint to initiate a workflow
router.post('/', validateMiddleware(createWorkflowDto), async (req, res) => {
  try {
    const {
      body: { styleId, brand, title }
    } = req;

    const workflow = await prisma.workflow.create({
      data: {
        styleId: styleId.toUpperCase(),
        brand,
        title,
        createProcess: CreateProcess.WRITER_INTERFACE
      }
    });

    return res.json(workflow);
  } catch (error) {
    console.error(error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          error:
            'There is a unique constraint violation, a workflow cannot be created with this styleId'
        });
      }
      return res
        .status(500)
        .json({ error: 'An error occurred while creating the workflow.' });
    }
    return res
      .status(500)
      .json({ error: 'An error occurred while creating the workflow.' });
  } finally {
    await prisma.$disconnect();
  }
});

// Endpoint to retrieve all workflows
router.get('/', async (req, res) => {
  try {
    const workflows = await prisma.workflow.findMany();
    res.json(workflows);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'An error occurred while retrieving the workflows.' });
  } finally {
    await prisma.$disconnect();
  }
});

// Endpoint to search workflows by name
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    const workflows = await prisma.workflow.findMany({
      where: {
        styleId: {
          contains: query,
          mode: 'insensitive'
        }
      }
    });

    res.json(workflows);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'An error occurred while searching workflows.' });
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
      return res.status(404).json({ error: 'Workflow not found.' });
    }
    return res.json(workflow);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: 'An error occurred while retrieving the workflow.' });
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

      res.json(updatedWorkflow);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: 'An error occurred while updating the workflow.' });
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

    res.json({ message: 'Workflow deleted successfully.' });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'An error occurred while deleting the workflow.' });
  } finally {
    await prisma.$disconnect();
  }
});

module.exports = router;
