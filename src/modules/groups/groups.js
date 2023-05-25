/* eslint-disable indent */
const express = require('express');
const axios = require('axios');

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
    return { accessToken: data?.access_token };
  } catch (error) {
    return { error };
  }
};

router.get('/token', async (req, res) => {
  const { accessToken, error } = (await getAccessToken()) || {};
  if (error) {
    return res.status(400).send({
      error
    });
  }
  return res.sendResponse({
    accessToken
  });
});

router.get('/all/:type', async (req, res) => {
  const { type } = req.params;
  const { MS_GRAPH_HOST_NAME, WRITERS_GROUP_ID, EDITOR_GROUP_ID, SIZING_GROUP_ID, ADMIN_GROUP_ID } =
    process.env;
  const { accessToken, error } = (await getAccessToken()) || {};
  if (error) {
    return res.sendResponse(
      {
        error
      },
      400
    );
  }
  let groupId;

  switch (type) {
    case 'writers':
      groupId = WRITERS_GROUP_ID;
      break;
    case 'editors':
      groupId = EDITOR_GROUP_ID;
      break;
    case 'admin':
      groupId = ADMIN_GROUP_ID;
      break;
    case 'sizing':
      groupId = SIZING_GROUP_ID;
      break;
    default:
      groupId = null;
  }

  if (!groupId) {
    return res.status(400).send({
      message: 'groupId is required field'
    });
  }

  try {
    const URL = `${MS_GRAPH_HOST_NAME}/groups/${groupId}/members`;
    const {
      data: { value }
    } = await axios.get(URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return res.status(200).send({
      members: value
    });
  } catch (error) {
    return res.status(400).send({
      error
    });
  }
});

module.exports = router;
