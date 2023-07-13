/* eslint-disable no-unused-vars */
const app = require('./src/app');
const { listenForMessages } = require('./src/pubsub');
const { properties } = require('./src/properties');

const { NETSUITE_PUBSUB_TOPIC } = properties;

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening: http://localhost:${port}`);
  // listenForMessages(NETSUITE_PUBSUB_TOPIC);
});
