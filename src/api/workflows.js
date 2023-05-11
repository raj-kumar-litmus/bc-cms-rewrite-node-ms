const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

// Endpoint to initiate a workflow
router.post('/', async (req, res) => {
  try {
    const { body: data } = req;
    const workflow = await prisma.workflow.create({
      data
    });

    res.json(workflow);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'An error occurred while creating the workflow.' });
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
  }
});

// Endpoint to search workflows by name
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    const workflows = await prisma.workflow.findMany({
      where: {
        style_id: {
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
  }
});

// Endpoint to retrieve a specific workflow
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await prisma.workflow.findUnique({
      where: {
        style_id: id
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
  }
});

// Endpoint to update a workflow
router.patch('/:id', async (req, res) => {
  try {
    const {
      params: { id },
      body: data
    } = req;

    const updatedWorkflow = await prisma.workflow.update({
      where: {
        style_id: id
      },
      data
    });

    res.json(updatedWorkflow);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'An error occurred while updating the workflow.' });
  }
});

// Endpoint to delete a workflow
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.workflow.delete({
      where: {
        style_id: id
      }
    });

    res.json({ message: 'Workflow deleted successfully.' });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: 'An error occurred while deleting the workflow.' });
  }
});

module.exports = router;
