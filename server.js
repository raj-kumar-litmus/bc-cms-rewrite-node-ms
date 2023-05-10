const express = require('express');
const fetch = require('node-fetch');
const validate = require('validate-azure-ad-token').default;

const app = express();
const PORT = 3010;
const configurations = require("./src/config");

app.use(express.json());
app.get('/mock', (req, res) => {
  console.log('Calling mock api !!!');
  res.sendStatus(200)
});

app.get('/', (req, res) => {
  console.log('Calling / api !!!');
  res.send("new api");
});

const fetchClientToken = async (token) => {
  const { tenantId, hostnameClient, msLoginHostName, defaultMsGraphScope, clientId, clientSecret } = configurations[process.env.NODE_ENV];

  const formData = new URLSearchParams();
  formData.append('grant_type', 'authorization_code');
  formData.append('client_secret', clientSecret);
  formData.append('client_id', clientId);
  formData.append('scope', defaultMsGraphScope);
  formData.append('code', token);
  formData.append('redirect_uri', `${hostnameClient}/redirect/web/`);

  const requestOptions = {
    method: 'POST',
    headers : {
      "Access-Control-Allow-Origin" : "*",
      "Access-Control-Allow-Methods" : "POST",
      "Access-Control-Allow-Headers" : "Content-Type",
      "Access-Control-Max-Age" : "3600",
      "Content-Type" : "application/x-www-form-urlencoded"
    },
    body: formData.toString(),
  };
  
  try {
    const response = await fetch(`${msLoginHostName}/${tenantId}/oauth2/v2.0/token`, requestOptions);
    const { access_token } = await response.json() || {};    
    return access_token;
  } catch (err) {
    return res.status(400).send({
      message: err
    });
  }
}

app.post('/validateJWT', async (req, res) => {
  const { jwt } =  req.body || {};
  const { tenantId, clientId } = configurations[process.env.NODE_ENV];

  try {
    const decodedToken = await validate(jwt, {
      tenantId: tenantId,
      audience: clientId,
      applicationId: "f7fdabfa-274a-4401-852d-b448a62f70d6",
      // scopes: 'YOUR_SCOPES', // for example ["User.Read"]
    });
  
    // DO WHATEVER YOU WANT WITH YOUR DECODED TOKEN
  } catch (error) {
    // ALL ERRORS GONNA SHOW HERE AS A STRING VALUE
    console.log(`Error during JWT validation`);
    console.log(error);
    return res.status(400).send({
      message: error
    });
  }
})

app.post('/clientToken', async (req, res) => {
  const {token, jwt } =  req.body || {};
  //todo. validate JWT.
  if(!token) {
    return res.status(400).send({
      message: 'Token is missing !'
   });
  }
  const access_token = await fetchClientToken(token);
  res.send({
    access_token,
  });
});

app.get('/login', (req, res) => {
  console.log('Calling login api !!!');
  // validate JWT token
  res.sendStatus(200);
})

app.listen(PORT);
console.log(`Running Backend on PORT : ${PORT}`);
