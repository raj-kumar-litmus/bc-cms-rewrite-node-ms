const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();
const app = require('./src/app');

const port = process.env.PORT || 5000;

console.log('Env variables ::::');
console.log(process.env);

async function accessSecretVersion() {
  const [version] = await client.accessSecretVersion({
    name: 'projects/744183811862/secrets/product-content-api-sac/latest'
  });

  return version?.payload?.data?.toString();
}

(async () => {
  try {
    console.log(`Fetching keys`);
    const keys = await accessSecretVersion();
    console.log(keys);
  } catch (err) {
    console.error('Something went wrong while fetching secret keys');
    console.error(err);
  }
})();

app.listen(port, () => {
  console.log(`Listening: http://localhost:${port}`);
});
