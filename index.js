const app = require('./src/app');
const properties = require('./config');

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Env variables :::: ${JSON.stringify(process.env)}`);
  console.log(`properties.mongo_url : ${properties.mongo_url}`);
  console.log(`properties.mongo_user : ${properties.mongo_user}`);
  console.log(`Listening: http://localhost:${port}`);
});
