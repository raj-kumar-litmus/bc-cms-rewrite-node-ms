const express = require('express');
const axios = require('axios');
const router = express.Router();
// const validate = require('validate-azure-ad-token').default;

const getAccessToken = async () => {
  const { CLIENT_SECRET, CLIENT_ID, DEFAULT_MS_GRAPH_SCOPE, MS_LOGIN_HOST_NAME, TENANT_ID } =
    process.env;
  try {
    const URL = `${MS_LOGIN_HOST_NAME}/${TENANT_ID}/oauth2/v2.0/token`;
    const {
      data: { access_token }
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
    return { access_token };
  } catch (error) {
    return { error };
  }
};

const accessToken = async (req, res) => {
  const { access_token, error } = (await getAccessToken()) || {};
  if (error) {
    return res.status(400).send({
      error
    });
  }
  return res.status(200).send({
    access_token
  });
};

const validateJWT = async (req, res) => {
  const { jwt } = req.body || {};
  const { tenantId, clientId } = configurations[process.env.NODE_ENV];

  if (!jwt) {
    return res.status(400).send({
      message: 'JWT missing from body'
    });
  }

  if (!tenantId || !clientId) {
    return res.status(400).send({
      message: 'tenantId and clientId are needed for JWT validation'
    });
  }

  try {
    const decodedToken = await validate(jwt, {
      tenantId: tenantId,
      audience: clientId,
      applicationId: 'f7fdabfa-274a-4401-852d-b448a62f70d6'
      // scopes: 'YOUR_SCOPES', // for example ["User.Read"]
    });

    res.status(200).send({
      decodedToken
    });

    // DO WHATEVER YOU WANT WITH YOUR DECODED TOKEN
  } catch (error) {
    // ALL ERRORS GONNA SHOW HERE AS A STRING VALUE
    return res.status(400).send({
      message: error
    });
  }
};

router.get('/all/:type', async (req, res) => {
  const { type } = req.params;
  const { MS_GRAPH_HOST_NAME, WRITERS_GROUP_ID, EDITOR_GROUP_ID } = process.env;
  const { access_token } = (await getAccessToken()) || {};
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
        Authorization: `Bearer ${access_token}`
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
router.get('/token', accessToken);

module.exports = router;
