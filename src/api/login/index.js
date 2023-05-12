const axios = require('axios');
const validate = require('validate-azure-ad-token').default;

const configurations = require("../../config");

const groupMembers = async (req, res) => {
  const { msGraphHostName } = configurations[process.env.NODE_ENV];
  const { accessToken, groupId } = req.body;
  if(!accessToken || !groupId) {
    return res.status(400).send({
      message: "Access Token and groupId are required fields"
    });
  }
  try {
    const URL = `${msGraphHostName}/groups/${groupId}/members`;
    const {data : members } = await axios.get(URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return res.status(200).send({
      members
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
  validateJWT
}