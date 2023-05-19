const express = require('express');

const { workflows } = require('./workflows');
const { dataNormalization } = require('./dataNormalization');

const router = express.Router();

router.use('/workflows', workflows);
router.use('/dataNormalization', dataNormalization);

module.exports = router;
