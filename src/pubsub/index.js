// const subscriptionNameOrId = 'YOUR_SUBSCRIPTION_NAME_OR_ID';
const { PubSub } = require('@google-cloud/pubsub');

let pubSubClient;
pubSubClient = pubSubClient || new PubSub();

function listenForMessages(subscriptionNameOrId) {
  const subscription = pubSubClient.subscription(subscriptionNameOrId);

  let messageCount = 0;
  const messageHandler = (message) => {
    console.log(`Received message ${message.id}:`);
    console.log(`\tData: ${message.data}`);
    console.log(`\tAttributes: ${message.attributes}`);
    messageCount += 1;
    message.ack();
  };
  subscription.on('message', messageHandler);
  console.log(`Waiting for messages from subscription ::: ${subscriptionNameOrId}`);
}

module.exports = {
  listenForMessages
};
