const {
  ATTRIBUTE_API_DOMAIN_NAME,
  COPY_API_DOMAIN_NAME,
  MERCH_API_DOMAIN_NAME,
  SIZING_API_DOMAIN_NAME
} = process.env;

const { postgresPrisma, mongoPrisma } = require('./prisma');

const isFulfilled = (status) => status === 'fulfilled';
const checkStatus = (status) => (status ? 'HEALTHY' : 'UNAVAILABLE');

const getHealth = async (_, res) => {
  const [mongoResp, postgresResp] = await Promise.allSettled([
    mongoPrisma.$runCommandRaw({ ping: 1 }),
    postgresPrisma.$queryRaw`SELECT VERSION()`
  ]);
  const overallStatus = [mongoResp, postgresResp].reduce(
    (prev, curr) => prev && isFulfilled(curr.status),
    true
  );
  return res.json({
    status: checkStatus(overallStatus),
    databases: {
      mongo: checkStatus(isFulfilled(mongoResp?.status)),
      postgres: checkStatus(isFulfilled(postgresResp?.status))
    },
    // needs to be implemented, need health endpoints for these APIs
    backCountryApis: [
      {
        name: 'attribute',
        url: ATTRIBUTE_API_DOMAIN_NAME,
        status: checkStatus('fulfilled')
      },
      {
        name: 'copy',
        url: COPY_API_DOMAIN_NAME,
        status: checkStatus('fulfilled')
      },
      {
        name: 'merch',
        url: MERCH_API_DOMAIN_NAME,
        status: checkStatus('fulfilled')
      },
      {
        name: 'sizing',
        url: SIZING_API_DOMAIN_NAME,
        status: checkStatus('fulfilled')
      }
    ]
  });
};

module.exports = {
  getHealth
};
