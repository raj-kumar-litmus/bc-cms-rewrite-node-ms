const axios = require('axios');
const { properties } = require('../../properties');
const { logger } = require('../../lib/logger');

const { MS_GRAPH_HOST_NAME } = properties;

const fetchGroupMembers = async (groupId, accessToken) => {
  const URL = `${MS_GRAPH_HOST_NAME}/groups/${groupId}/members`;
  logger.info({ URL, groupId, accessToken }, 'Fetching group Members');
  const {
    data: { value: members }
  } = await axios.get(URL, {
    headers: {
      Authorization: accessToken
    }
  });

  return members;
};

module.exports = {
  fetchGroupMembers
};
