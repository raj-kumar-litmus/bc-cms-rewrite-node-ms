/* eslint-disable consistent-return,no-underscore-dangle,prefer-promise-reject-errors */
const request = require('supertest');
const axios = require('axios');
const app = require('../../../app');

jest.mock('axios');

const outhTokenApi = () => {
  axios.post.mockImplementation((url) => {
    if (url.includes('oauth2/v2.0/token')) {
      return Promise.resolve({
        data: { access_token: 'accessToken' }
      });
    }
  });
};

const outhTokenApiError = () => {
  axios.post.mockImplementation((url) => {
    if (url.includes('oauth2/v2.0/token')) {
      return Promise.reject({});
    }
  });
};

describe('/api/v1/groups/token', () => {
  test('it should return the 401 response', async () => {
    const response = await request(app).get('/api/v1/groups/token');
    expect(response.statusCode).toEqual(401);
  });
});

describe('/api/v1/groups/:type/members', () => {
  test('it should return the 400 response', async () => {
    const response = await request(app).get('/api/v1/groups/123/members');
    expect(response.statusCode).toEqual(400);
  });

  test('it should return the false response for writer', async () => {
    outhTokenApiError();
    const response = await request(app).get('/api/v1/groups/writers/members');
    expect(response._body.success).toEqual(false);
  });

  test('it should return the false response for writer', async () => {
    outhTokenApi();
    const response = await request(app).get('/api/v1/groups/writers/members');
    expect(response._body.success).toEqual(false);
  });

  test('it should return the false response for all', async () => {
    outhTokenApi();
    const response = await request(app).get('/api/v1/groups/all/members');
    expect(response._body.success).toEqual(false);
  });
});

describe('/api/v1/groups/test/members', () => {
  test('it should return 400 response', async () => {
    const response = await request(app).get('/api/v1/groups/test/members');
    expect(response.statusCode).toEqual(400);
  });

  test(' it should return 500 response', async () => {
    const response = await request(app).get('/api/v1/groups/editors/members');
    expect(response.statusCode).toEqual(500);
  });
});
