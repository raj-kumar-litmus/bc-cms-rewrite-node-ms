const express = require('express');
const { validateMiddleware, authorize } = require('../../middlewares');
const { groupsDto } = require('./dtos');
const { properties, groups } = require('../../properties');
const { deDuplicate } = require('../../utils');
const { fetchGroupMembers } = require('./utils');
const { logger } = require('../../lib/logger');

const { AxiosInterceptor } = require('../../lib/axios');

const router = express.Router();

const {
  CLIENT_SECRET,
  CLIENT_ID,
  DEFAULT_MS_GRAPH_SCOPE,
  MS_LOGIN_HOST_NAME,
  TENANT_ID,
  ADMIN_GROUP_ID,
  WRITERS_GROUP_ID,
  EDITOR_GROUP_ID
} = properties;

const getAccessToken = async () => {
  const URL = `${MS_LOGIN_HOST_NAME}/${TENANT_ID}/oauth2/v2.0/token`;
  logger.info(
    {
      URL,
      client_secret: CLIENT_SECRET,
      client_id: CLIENT_ID,
      scope: DEFAULT_MS_GRAPH_SCOPE
    },
    'Fetching access token'
  );
  const {
    data: { access_token: accessToken }
  } = await AxiosInterceptor.post(
    URL,
    {
      grant_type: 'client_credentials',
      client_secret: CLIENT_SECRET,
      client_id: CLIENT_ID,
      scope: DEFAULT_MS_GRAPH_SCOPE
    },
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return accessToken ? `Bearer ${accessToken}` : undefined;
};

router.get('/token', async (req, res) => {
  try {
    const accessToken = await getAccessToken();

    return res.sendResponse(
      {
        accessToken
      },
      200
    );
  } catch (error) {
    const { stack, message } = error;
    logger.error({ stack, message, error }, 'Error while fetching token');
    return res.sendResponse('Error while fetching token', 401);
  }
});

router.get(
  '/:type/members',
  authorize([groups.ADMIN_GROUP_NAME, groups.WRITER_GROUP_NAME, groups.EDITOR_GROUP_NAME]),
  validateMiddleware({ params: groupsDto }),
  async (req, res) => {
    const { type } = req.params;
    logger.info({ params: req.params }, 'Fetching Azure AD group members');
    let accessToken;
    try {
      accessToken = await getAccessToken();
    } catch (error) {
      const { stack, message } = error;
      logger.error({ stack, message, error }, 'Failed to fetch access token');
      return res.sendResponse('Failed to fetch access token', 500);
    }

    let groupId;
    /* eslint-disable indent */
    switch (type) {
      case 'writers':
        groupId = WRITERS_GROUP_ID;
        break;
      case 'editors':
        groupId = EDITOR_GROUP_ID;
        break;
      default:
        break;
    }

    try {
      if (type === 'all') {
        const results = await Promise.allSettled([
          fetchGroupMembers(ADMIN_GROUP_ID, accessToken),
          fetchGroupMembers(WRITERS_GROUP_ID, accessToken),
          fetchGroupMembers(EDITOR_GROUP_ID, accessToken)
        ]);

        const members = Array.isArray(results) && results.map((result) => result?.value);

        return res.sendResponse(deDuplicate(members.flat(Infinity), 'mail'), 200);
      }
      const members = await fetchGroupMembers(groupId, accessToken);

      return res.sendResponse(members, 200);
    } catch (error) {
      const { stack, message } = error;
      logger.error({ stack, message, error }, 'Error while fetching Azure AD group members');
      return res.sendResponse('Failed to fetch members', 500);
    }
  }
);

module.exports = router;
