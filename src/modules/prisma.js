const {
  PrismaClient: MongoPrismaClient
} = require('../../prisma/node_modules/.prisma/client/mongo');
const {
  PrismaClient: PostgresPrismaClient
} = require('../../prisma/node_modules/.prisma/client/postgres');

const mongoPrisma = new MongoPrismaClient({});
const postgresPrisma = new PostgresPrismaClient({});

module.exports = {
  mongoPrisma,
  postgresPrisma
};
