const express = require('express');

const { workflows } = require('./workflows');
const { dataNormalization } = require('./dataNormalization');
const { groups } = require('./groups');
const { styles } = require('./styles');
const { sizing } = require('./sizing');

const router = express.Router();

router.use('/workflows', workflows);
router.use('/dataNormalization', dataNormalization);
router.use('/styles', styles);
router.use('/groups', groups);
router.use('/sizing', sizing);

module.exports = router;
