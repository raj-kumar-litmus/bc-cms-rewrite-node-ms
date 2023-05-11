const express = require('express');

const workflows = require('./workflows');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏'
  });
});

router.use('/workflows', workflows);

module.exports = router;
