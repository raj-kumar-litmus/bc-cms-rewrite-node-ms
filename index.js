/* eslint-disable no-unused-vars */
const app = require('./src/app');
const { listenForMessages } = require('./src/pubsub');
const { properties } = require('./src/properties');
const { logger } = require('./src/lib/logger');

const { NETSUITE_PUBSUB_TOPIC } = properties;

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening: http://localhost:${port}`);
  console.log(properties);
  try {
    listenForMessages(NETSUITE_PUBSUB_TOPIC);
  } catch (err) {
    logger.error({ err }, 'Error occuring while listening to pubsub calls');
  }
});
