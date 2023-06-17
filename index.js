const app = require('./src/app');
const { listenForMessages } = require('./src/pubsub');

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening: http://localhost:${port}`);
  // listenForMessages('bcg-sub-mer-tt-prdct-cont-01'); // todo. move 'bcg-sub-mer-sg-prdct-cont-01' to env var
});
