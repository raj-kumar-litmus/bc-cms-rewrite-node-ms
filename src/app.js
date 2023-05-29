const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

require('dotenv').config();

const middlewares = require('./middlewares');
const modules = require('./modules');

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/sanity', (_, res) => {
  res.send(200).json({
    ok: true
  });
});

app.use(middlewares.responseInterceptor);
// app.use(middlewares.errorHandler);

app.use('/api/v1', modules);

app.use(middlewares.notFound);

module.exports = app;
