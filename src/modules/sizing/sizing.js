const express = require('express');
const axios = require('axios');

const router = express.Router();

const { postgresPrisma } = require('../prisma');
const { logger } = require('../../lib/logger');
const { validateMiddleware } = require('../../middlewares');
const { createSizeValueDto } = require('./dtos');

router.get('/scales/all', async (req, res) => {
  try {
    const scales = await postgresPrisma.$queryRaw`select * from dn_scales`;
    return res.sendResponse({
      scales
    });
  } catch (err) {
    logger.error({ err }, 'Error occured while fetching scales');
    return res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/scales/details/:scaleid', async (req, res) => {
  try {
    const { scaleid } = req.params;
    const scales = await postgresPrisma.$queryRaw`select * from dn_sizes where scaleid=${parseInt(
      scaleid
    )}`;
    return res.sendResponse({
      scales
    });
  } catch (err) {
    logger.error({ err }, 'Error occured while fetching scale details');
    return res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/sizevalues', async (req, res) => {
  try {
    const scales = await postgresPrisma.$queryRaw`select * from dn_sizevalues`;
    return res.sendResponse({
      scales
    });
  } catch (err) {
    logger.error({ err }, 'Error occured while fetching size values');
    return res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/productgroups', async (req, res) => {
  try {
    const { data: productgroups } = await axios.get(
      'http://merch01.bcinfra.net:8080/merchv3/light-product-groups'
    );
    return res.sendResponse({
      productgroups
    });
  } catch (err) {
    logger.error({ err }, 'Error occured while fetching productgroups');
    return res.sendResponse('Internal Server Error', 500);
  }
});

router.post(
  '/sizevalue/add',
  validateMiddleware({ body: createSizeValueDto }),
  async (req, res) => {
    try {
      const { name, description } = req.body;
      await postgresPrisma.$queryRaw`INSERT INTO dn_sizevalues(name,description) VALUES (${name},${description});`;
      return res.sendResponse({});
    } catch (err) {
      logger.error({ err }, 'Error occured while inserting size values');
      return res.sendResponse('Internal Server Error', 500);
    }
  }
);

module.exports = router;
