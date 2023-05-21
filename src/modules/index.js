const express = require('express');

const { workflows } = require('./workflows');
const { dataNormalization } = require('./dataNormalization');
const { users } = require('./users');

const router = express.Router();

router.use('/workflows', workflows);
router.use('/dataNormalization', dataNormalization);
router.use('/users', users);

module.exports = router;
