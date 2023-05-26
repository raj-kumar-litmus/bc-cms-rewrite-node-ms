const express = require('express');
const axios = require('axios');
const { validateMiddleware } = require('../../middlewares');
const { groupDto } = require('./dtos');

const router = express.Router();

const getAccessToken = async () => {
  const { CLIENT_SECRET, CLIENT_ID, DEFAULT_MS_GRAPH_SCOPE, MS_LOGIN_HOST_NAME, TENANT_ID } =
    process.env;
  try {
    const URL = `${MS_LOGIN_HOST_NAME}/${TENANT_ID}/oauth2/v2.0/token`;
    const { data } = await axios.post(
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
    return `Bearer ${data?.access_token}`;
  } catch (error) {
    return null;
  }
};

router.get('/token', async (req, res) => {
  const token = (await getAccessToken()) || {};
  if (!token) {
    return res.sendResponse({}, 400);
  }
  return res.sendResponse(
    {
      accessToken: token
    },
    200
  );
});

router.get('/all/:type/members', validateMiddleware({ params: groupDto }), async (req, res) => {
  const { type } = req.params;
  const { MS_GRAPH_HOST_NAME, WRITERS_GROUP_ID, EDITOR_GROUP_ID } = process.env;
  const accessToken = (await getAccessToken()) || {};
  if (!accessToken) {
    return res.sendResponse('UnAuthorized', 400);
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
  /* eslint-enable indent */

  try {
    const URL = `${MS_GRAPH_HOST_NAME}/groups/${groupId}/members`;
    const {
      data: { value }
    } = await axios.get(URL, {
      headers: {
        Authorization: accessToken
      }
    });
    return res.sendResponse(
      {
        members: value
      },
      200
    );
  } catch (error) {
    return res.sendResponse(error, 400);
  }
});

module.exports = router;
