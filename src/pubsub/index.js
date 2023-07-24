const { PubSub } = require('@google-cloud/pubsub');
const { mongoPrisma } = require('../modules/prisma');
const { logger } = require('../lib/logger');
const { createWorkflow } = require('../modules/workflows/utils');

const listenForMessages = (subscriptionNameOrId) => {
  const pubSubClient = new PubSub();
  const subscription = pubSubClient.subscription(subscriptionNameOrId);

  const messageHandler = async (message) => {
    const { style: styleId } = JSON.parse(message.data.toString()) || {};
    logger.info({ styleId }, 'Create workflow message received from pubsub topic');
    try {
      const workflow = await mongoPrisma.workflow.findFirst({
        where: { styleId }
      });
      if (workflow) {
        logger.warn({ styleId }, 'Workflow already exists');
        return;
      }
      await createWorkflow({ styleId });
      message.ack();
    } catch (error) {
      console.log(error);
    }
  };
  subscription.on('message', messageHandler);
  subscription.on('error', (error) => {
    logger.error({ error }, 'Error occuring while subscribing to pubsub calls');
  });
  console.log(`Waiting for messages from subscription ::: ${subscriptionNameOrId}`);
};

module.exports = {
  listenForMessages
};
