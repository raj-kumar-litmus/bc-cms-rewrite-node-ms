const {
  PrismaClient: MongoPrismaClient
} = require('../../prisma/node_modules/.prisma/client/mongo');
const {
  PrismaClient: PostgresPrismaClient
} = require('../../prisma/node_modules/.prisma/client/postgres');

const mongoPrisma = new MongoPrismaClient({
  log: ['query', 'info', 'warn', 'error']
});
const postgresPrisma = new PostgresPrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

module.exports = {
  mongoPrisma,
  postgresPrisma
};
