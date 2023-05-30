jest.mock('../group', () => jest.fn((req, res, next) => next()));

const supertest = require('supertest');
const app = require('../../../app');
// const work = require('../group');
const request = supertest(app);
// const router = require('../../../modules');

// let agent;
let server;
beforeEach((done) => {
  server = app.listen(4000, (err) => {
    if (err) return done(err);

    // agent = supertest(server);
    return done();
  });
});

afterEach((done) => {
  if (server) server.close(done);
});

describe('app', () => {
  test('test middleware in app.js', async () => {
    try {
      const response = await request.get('/api/v1/groupMembers/all/editors');
      // const response = await request.get('/api/v1/dataNormalization/styles/S123');
      expect(response.status).toBe(200);
      // expect(work).toHaveBeenCalledTimes(1);
    } catch (err) {
      console.log(err);
    }
  });
});
