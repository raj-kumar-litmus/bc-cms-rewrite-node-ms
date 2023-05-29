const express = require('express');
const axios = require('axios');
const { validateMiddleware } = require('../../middlewares');
const { groupsDto } = require('./dtos');

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
} = process.env;

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
    const URL = `${MS_GRAPH_HOST_NAME}/groups/${groupId}/members`;
    const {
      data: { value: members }
    } = await axios.get(URL, {
      headers: {
        Authorization: accessToken
      }
    });

    return res.sendResponse(members, 200);
  } catch (error) {
    console.error(error);
    return res.sendResponse('Failed to fetch members', 500);
  }
});

module.exports = router;
