const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const { validateJWT, groupMembers, accessToken } = require("./src/api/login");
const PORT = 3010;

app.use(express.json());

// support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/validateJWT', validateJWT);

app.get('/groupMembers/:type', groupMembers);

app.post('/accessToken', accessToken);

app.listen(PORT);
console.log(`Running Backend on PORT : ${PORT}`);
