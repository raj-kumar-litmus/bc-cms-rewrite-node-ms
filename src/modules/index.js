const express = require('express');

const { workflows } = require('./workflows');
const { dataNormalization } = require('./dataNormalization');
const { groups } = require('./groups');

const router = express.Router();

router.use('/workflows', workflows);
router.use('/dataNormalization', dataNormalization);
router.use('/groups', groups);

module.exports = router;
