const express = require('express');

const { workflows } = require('./workflows');

const router = express.Router();

router.use('/workflows', workflows);

module.exports = router;
