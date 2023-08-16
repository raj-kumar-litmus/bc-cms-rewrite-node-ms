const { properties } = require('../../properties');
const { logger } = require('../../lib/logger');
const { AxiosInterceptor } = require('../../lib/axios');

const { MS_GRAPH_HOST_NAME } = properties;

const fetchGroupMembers = async (groupId, accessToken) => {
  const URL = `${MS_GRAPH_HOST_NAME}/groups/${groupId}/members`;
  logger.info({ URL, groupId, accessToken }, 'Fetching group Members');
  const {
    data: { value: members }
  } = await AxiosInterceptor.get(URL, {
    headers: {
      Authorization: accessToken
    }
  });

  return members;
};

module.exports = {
  fetchGroupMembers
};
