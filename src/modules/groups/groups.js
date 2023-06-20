const express = require('express');
const axios = require('axios');
const { validateMiddleware } = require('../../middlewares');
const { groupsDto } = require('./dtos');
const { properties } = require('../../properties');
const { deDuplicate } = require('../../utils');
const { fetchGroupMembers } = require('./utils');

const router = express.Router();

const {
  CLIENT_SECRET,
  CLIENT_ID,
  DEFAULT_MS_GRAPH_SCOPE,
  MS_LOGIN_HOST_NAME,
  TENANT_ID,
  MS_GRAPH_HOST_NAME,
  WRITERS_GROUP_ID,
  EDITOR_GROUP_ID
} = properties;

const getAccessToken = async () => {
  const URL = `${MS_LOGIN_HOST_NAME}/${TENANT_ID}/oauth2/v2.0/token`;
  const {
    data: { access_token: accessToken }
  } = await axios.post(
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
    return res.sendResponse('Error while fetching token', 401);
  }
});

router.get('/:type/members', validateMiddleware({ params: groupsDto }), async (req, res) => {
  const { type } = req.params;

  let accessToken;
  try {
    accessToken = await getAccessToken();
  } catch (error) {
    console.error(error);
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
        fetchGroupMembers(WRITERS_GROUP_ID, accessToken),
        fetchGroupMembers(EDITOR_GROUP_ID, accessToken)
      ]);

      const [writersGroupMembers, editorsGroupMembers] =
        Array.isArray(results) && results.map((result) => result?.value);

      return res.sendResponse(
        deDuplicate([...writersGroupMembers, ...editorsGroupMembers], 'mail'),
        200
      );
    } else {
      const members = await fetchGroupMembers(groupId, accessToken);

      return res.sendResponse(members, 200);
    }
  } catch (error) {
    console.error(error);
    return res.sendResponse('Failed to fetch members', 500);
  }
});

module.exports = router;
