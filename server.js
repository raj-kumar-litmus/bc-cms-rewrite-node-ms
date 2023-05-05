const express = require('express');
const app = express();

const PORT = 3010;

app.get('/mock', (req, res) => {
  console.log('Calling mock api !!!');
  res.sendStatus(200)
})

app.listen(PORT);
console.log(`Running Backend on PORT : ${PORT}`);
