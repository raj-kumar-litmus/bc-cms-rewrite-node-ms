const axios = require('axios');
const validate = require('validate-azure-ad-token').default;

const configurations = require("../../config");

const getAccessToken = async () => {
  const { clientSecret, clientId, defaultMsGraphScope, tenantId, msLoginHostName } = configurations[process.env.NODE_ENV];
  try {
    const URL = `${msLoginHostName}/${tenantId}/oauth2/v2.0/token`;
    const {data : {access_token }} = await axios.post(URL, {
      'grant_type': 'client_credentials',
      'client_secret' : clientSecret,
      'client_id' : clientId,
      'scope' : defaultMsGraphScope
    },{
    headers: {
      'Content-Type': 'multipart/form-data'
    }});
    return { access_token };
  } catch(error) {
    return { error };
  }
}

const accessToken = async (req, res) => {
  const {access_token, error} = await getAccessToken() || {};
  if(error) {
    return res.status(400).send({
      error
    });
  }
  return res.status(200).send({
    access_token
  });
};

const groupMembers = async (req, res) => {
  const { type } = req.params;
  const { msGraphHostName, writersGroupId, editorGroupId } = configurations[process.env.NODE_ENV];
  const {access_token} = await getAccessToken() || {};
  let groupId;
  if(type === "writers") {
    groupId = writersGroupId;
  }
  if(type === "editors") {
    groupId = editorGroupId;
  }
  if(!groupId) {
    return res.status(400).send({
      message: "groupId is required field"
    });
  }
  try {
    const URL = `${msGraphHostName}/groups/${groupId}/members`;
    const {data : {value} } = await axios.get(URL, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    return res.status(200).send({
      members: value
    });
  } catch(error) {
    return res.status(400).send({
      error
    });
  }
};

const validateJWT = async (req, res) => {
  const { jwt } =  req.body || {};
  const { tenantId, clientId } = configurations[process.env.NODE_ENV];

  if(!jwt) {
    return res.status(400).send({
      message: "JWT missing from body"
    });
  }

  if(!tenantId || !clientId) {
    return res.status(400).send({
      message: "tenantId and clientId are needed for JWT validation"
    });
  }

  try {
    const decodedToken = await validate(jwt, {
      tenantId: tenantId,
      audience: clientId,
      applicationId: "f7fdabfa-274a-4401-852d-b448a62f70d6",
      // scopes: 'YOUR_SCOPES', // for example ["User.Read"]
    });

    res.status(200).send({
      decodedToken,
    });
  
    // DO WHATEVER YOU WANT WITH YOUR DECODED TOKEN
  } catch (error) {
    // ALL ERRORS GONNA SHOW HERE AS A STRING VALUE
    return res.status(400).send({
      message: error
    });
  }
};

module.exports = {
  groupMembers,
  accessToken,
  validateJWT
}