const express = require('express');
const axios = require('axios');

const { postgresPrisma } = require('../prisma');

const router = express.Router();

const getConfig = (req) => {
  const { cookie: Cookie } = req.headers; // Retrieve the Cookie header value

  return {
    headers: {
      Cookie
    },
    followRedirects: true
  };
};

router.get('/styles/:styleId', async (req, res) => {
  const { styleId } = req.params;
  const url = `${process.env.backContryAPI}/dataNormalization/rest/products/${styleId}`;
  console.log(url);
  try {
    const {
      data: {
        item: { brand, productTitle }
      }
    } = await axios.get(url, getConfig(req));

    res.sendResponse({ styleId, brand: brand.name, title: productTitle });
  } catch (error) {
    console.error(error.message);
    res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/styles/:styleId/techSpecs', async (req, res) => {
  const { styleId } = req.params;
  const url = `${process.env.backContryAPI}/dataNormalization/rest/products/${styleId}`;
  console.log(url);
  try {
    const {
      data: {
        item: { techSpecs }
      }
    } = await axios.get(url, getConfig(req));

    res.sendResponse(techSpecs);
  } catch (error) {
    console.error(error.message);
    res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/genus', async (req, res) => {
  try {
    // Query the database using Prisma Client
    const genus = await postgresPrisma.dn_genus.findMany();
    res.send(genus);
  } catch (error) {
    console.error(error.message);
    res.send('Internal Server Error').status(500);
  }
});

router.get('/genus/:genusId/species', async (req, res) => {
  const { genusId } = req.params;
  const url = `${process.env.backContryAPI}/dataNormalization/rest/genus/${genusId}/species`;
  try {
    const { data } = await axios.get(url, getConfig(req));
    res.sendResponse(data);
  } catch (error) {
    console.error(error.message);
    res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/genus/:genusId/species/:styleId/hAttributes', async (req, res) => {
  const { genusId, styleId } = req.params;
  const url = `${process.env.backContryAPI}/dataNormalization/rest/genus/${genusId}/species/${styleId}/hAttributes`;
  try {
    const { data } = await axios.get(url, getConfig(req));
    res.sendResponse(data);
  } catch (error) {
    console.error(error.message);
    res.sendResponse('Internal Server Error', 500);
  }
});

module.exports = router;
