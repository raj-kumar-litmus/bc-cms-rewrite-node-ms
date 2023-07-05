const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

require('dotenv').config();

const middlewares = require('./middlewares');
const modules = require('./modules');
const { getHealth } = require('./modules/health');

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', getHealth);

app.use(middlewares.responseInterceptor);
// app.use(middlewares.errorHandler);

app.use('/api/v1', modules);

app.use(middlewares.notFound);

module.exports = app;
