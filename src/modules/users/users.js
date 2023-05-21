const express = require('express');
// const axios = require('axios');
// const { PrismaClient } = require('@prisma/client');

const router = express.Router();

// const prisma = new PrismaClient({
//   log: ['query', 'info', 'warn', 'error']
// });

router.get('/', async (req, res) => {
  const { role } = req.query;
  const users = [];

  try {
    if (role === 'writer') {
      for (let i = 1; i <= 100; i++) {
        users.push(`writer${i}@backcountry.com`);
      }
    } else if (role === 'editor') {
      for (let i = 1; i <= 100; i++) {
        users.push(`editor${i}@backcountry.com`);
      }
    } else {
      return res.sendResponse('Invalid role', 400);
    }

    return res.sendResponse(users, 200);
  } catch (error) {
    console.error(error.message);
    return res.sendResponse('An error occurred while searching users.', 500);
  }
});

module.exports = router;
