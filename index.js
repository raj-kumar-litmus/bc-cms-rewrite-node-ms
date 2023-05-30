const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();
const app = require('./src/app');

const port = process.env.PORT || 5000;

console.log(process.env);

async function accessSecretVersion() {
  const [version] = await client.accessSecretVersion({
    name: 'projects/744183811862/secrets/product-content-api-sac/latest'
  });

  const payload = version?.payload?.data?.toString();

  console.info(`Payload: ${payload}`);
}

try {
  accessSecretVersion();
} catch (err) {
  console.error('Something went wrong while fetching secret keys');
  console.error(err);
}

app.listen(port, () => {
  console.log(`Listening: http://localhost:${port}`);
});
