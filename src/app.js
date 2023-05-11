const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const axios = require('axios');

require('dotenv').config();

const middlewares = require('./middlewares');
const modules = require('./modules');

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/', (_, res) => {
  res.json({
    ok: true
  });
});

const config = {
  headers: {
    Cookie: 'JSESSIONID=6677E756EC081AF2EC210678A4961C9A'
  }
};

app.get('/style/:sId/techSpecs', async (req, res) => {
  const { sId } = req.params;
  const url = `${process.env.backContryAPI}/dataNormalization/rest/products/${sId}`;
  try {
    const {
      data: {
        item: { techSpecs }
      }
    } = await axios.get(url, config);

    res.send(techSpecs);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/genus', async (req, res) => {
  const url = `${process.env.backContryAPI}/dataNormalization/rest/genus`;
  try {
    const { data } = await axios.get(url, config);
    res.send(data);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/genus/:gId/species', async (req, res) => {
  const { gId } = req.params;
  const url = `${process.env.backContryAPI}/dataNormalization/rest/genus/${gId}/species`;
  try {
    const { data } = await axios.get(url, config);
    res.send(data);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/genus/:gId/species/:sId/hAttributes', async (req, res) => {
  const { gId, sId } = req.params;
  const url = `${process.env.backContryAPI}/dataNormalization/rest/genus/${gId}/species/${sId}/hAttributes`;
  try {
    const { data } = await axios.get(url, config);
    res.send(data);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.use('/api/v1', modules);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;
