const { PubSub } = require('@google-cloud/pubsub');
const { mongoPrisma } = require('../modules/prisma');
const { logger } = require('../lib/logger');
const { createWorkflow } = require('../modules/workflows/utils');

const listenForMessages = (subscriptionNameOrId) => {
  const pubSubClient = new PubSub();
  const subscription = pubSubClient.subscription(subscriptionNameOrId);

  const messageHandler = async (message) => {
    const workflowCreationStartTime = new Date();
    const { style: styleId } = JSON.parse(message.data.toString()) || {};
    logger.info({ styleId }, 'Create workflow message received from pubsub topic');
    try {
      const workflow = await mongoPrisma.workflow.findFirst({
        where: { styleId }
      });
      if (workflow) {
        const workflowCreationDuration = new Date() - workflowCreationStartTime;
        logger.warn({ styleId, workflowCreationDuration }, 'Workflow already exists');
        return;
      }
      await createWorkflow({ styleId });
      message.ack();
      const workflowCreationDuration = new Date() - workflowCreationStartTime;
      logger.info({ styleId, workflowCreationDuration }, 'Create workflow message acknowledgement');
    } catch (error) {
      const workflowCreationDuration = new Date() - workflowCreationStartTime;
      logger.error({ styleId, workflowCreationDuration }, 'Create workflow failure');
      logger.error(error);
    }
  };
  subscription.on('message', messageHandler);
  subscription.on('error', (error) => {
    const { stack, message } = error;
    logger.error({ stack, message, error }, 'Error occuring while subscribing to pubsub calls');
  });
  logger.info({ subscriptionNameOrId }, 'Waiting for messages from subscription');
};

module.exports = {
  listenForMessages
};
