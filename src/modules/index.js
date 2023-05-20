const express = require('express');

const { workflows } = require('./workflows');
const { dataNormalization } = require('./dataNormalization');
const { group } = require('./group');

const router = express.Router();

router.use('/workflows', workflows);
router.use('/dataNormalization', dataNormalization);
router.use('/groupMembers', group);

module.exports = router;
