const express = require('express');
const axios = require('axios');

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

router.get('/styles/:sId', async (req, res) => {
  const { sId } = req.params;
  const url = `${process.env.backContryAPI}/dataNormalization/rest/products/${sId}`;
  console.log(url);
  try {
    const {
      data: {
        item: { brand, productTitle }
      }
    } = await axios.get(url, getConfig(req));

    res.sendResponse({ styleId: sId, brand: brand.name, title: productTitle });
  } catch (error) {
    console.error(error.message);
    res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/styles/:sId/techSpecs', async (req, res) => {
  const { sId } = req.params;
  const url = `${process.env.backContryAPI}/dataNormalization/rest/products/${sId}`;
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
  const url = `${process.env.backContryAPI}/dataNormalization/rest/genus`;
  try {
    const { data } = await axios.get(url, getConfig(req));
    res.sendResponse(data);
  } catch (error) {
    console.error(error.message);
    res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/genus/:gId/species', async (req, res) => {
  const { gId } = req.params;
  const url = `${process.env.backContryAPI}/dataNormalization/rest/genus/${gId}/species`;
  try {
    const { data } = await axios.get(url, getConfig(req));
    res.sendResponse(data);
  } catch (error) {
    console.error(error.message);
    res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/genus/:gId/species/:sId/hAttributes', async (req, res) => {
  const { gId, sId } = req.params;
  const url = `${process.env.backContryAPI}/dataNormalization/rest/genus/${gId}/species/${sId}/hAttributes`;
  try {
    const { data } = await axios.get(url, getConfig(req));
    res.sendResponse(data);
  } catch (error) {
    console.error(error.message);
    res.sendResponse('Internal Server Error', 500);
  }
});

module.exports = router;
