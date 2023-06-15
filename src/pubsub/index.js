// const subscriptionNameOrId = 'YOUR_SUBSCRIPTION_NAME_OR_ID';
const { PubSub } = require('@google-cloud/pubsub');
const { createWorkflow } = require('../modules/workflows/utils');

const listenForMessages = (subscriptionNameOrId) => {
  const pubSubClient = new PubSub();
  const subscription = pubSubClient.subscription(subscriptionNameOrId);

  const messageHandler = async (message) => {
    console.log(`message received from pubsub`);
    console.log(message);
    const { style: styleId } = JSON.parse(message.data.toString()) || {};
    await createWorkflow({ styleId });
    message.ack();
  };
  subscription.on('message', messageHandler);
  console.log(`Waiting for messages from subscription ::: ${subscriptionNameOrId}`);
};

module.exports = {
  listenForMessages
};
