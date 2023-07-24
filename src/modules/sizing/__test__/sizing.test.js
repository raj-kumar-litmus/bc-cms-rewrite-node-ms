/* eslint-disable consistent-return */
const request = require('supertest');
const axios = require('axios');
const app = require('../../../app');

jest.mock('axios');

axios.get.mockImplementation((url) => {
  if (url.includes('/merchv3/light-product-groups')) {
    return Promise.resolve({
      data: [
        {
          id: 200004187,
          name: 'Gear Care - PS'
        },
        {
          id: 100003661,
          name: 'Avalanche Safety Gear - PS'
        }
      ]
    });
  }
});

jest.mock('../../../../prisma/node_modules/.prisma/client/postgres', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $queryRaw: ([query]) => {
      if (query === 'select * from dn_sizevalues') {
        return [
          {
            id: 1,
            name: '700x330c',
            description: ''
          },
          {
            id: 2,
            name: '700x331c',
            description: ''
          }
        ];
      }
      if (query.includes('select * from dn_sizes where scaleid=')) {
        return [
          {
            id: 297,
            scaleid: 7,
            name: 'Long',
            description: 'Long',
            position: 6,
            last_modified: '2018-12-10T12:24:01.000Z'
          },
          {
            id: 4453,
            scaleid: 7,
            name: 'Extra Large',
            description: 'Extra Large',
            position: 5,
            last_modified: '2018-12-10T12:24:01.000Z'
          }
        ];
      }
      if (query === 'select * from dn_scales') {
        return [
          {
            id: 161,
            name: 'Hats Alphabetical Slash',
            description: 'Hats Alphabetical Slash',
            last_modified: '2016-10-14T08:51:37.000Z'
          },
          {
            id: 162,
            name: "Women's Alphabetical(with Shape A/H)",
            description: "Women's Alphabetical(with Shape A/H)",
            last_modified: '2016-10-14T08:51:37.000Z'
          }
        ];
      }
      if (query.includes('INSERT INTO dn_sizevalues(name,description) VALUES')) {
        return true;
      }
    }
  }))
}));

describe('Test /sizevalues', () => {
  test('it should return the mocked response', async () => {
    const response = await request(app).get('/api/v1/sizing/sizevalues');
    expect(response.body.data).toEqual({
      scales: [
        {
          id: 1,
          name: '700x330c',
          description: ''
        },
        {
          id: 2,
          name: '700x331c',
          description: ''
        }
      ]
    });
  });
});

describe('Test /scales/details/123', () => {
  test('it should return the mocked response', async () => {
    const response = await request(app).get('/api/v1/sizing/scales/details/123');
    expect(response.body.data).toEqual({
      scales: [
        {
          id: 297,
          scaleid: 7,
          name: 'Long',
          description: 'Long',
          position: 6,
          last_modified: '2018-12-10T12:24:01.000Z'
        },
        {
          id: 4453,
          scaleid: 7,
          name: 'Extra Large',
          description: 'Extra Large',
          position: 5,
          last_modified: '2018-12-10T12:24:01.000Z'
        }
      ]
    });
  });
});

describe('Test /scales/all', () => {
  test('it should return the mocked response', async () => {
    const response = await request(app).get('/api/v1/sizing/scales/all');
    expect(response.body.data).toEqual({
      scales: [
        {
          id: 161,
          name: 'Hats Alphabetical Slash',
          description: 'Hats Alphabetical Slash',
          last_modified: '2016-10-14T08:51:37.000Z'
        },
        {
          id: 162,
          name: "Women's Alphabetical(with Shape A/H)",
          description: "Women's Alphabetical(with Shape A/H)",
          last_modified: '2016-10-14T08:51:37.000Z'
        }
      ]
    });
  });
});

describe('Test /scales/productgroups', () => {
  test('it should return the mocked response', async () => {
    const response = await request(app).get('/api/v1/sizing/productgroups');
    expect(response.body.data).toEqual({
      productgroups: [
        {
          id: 200004187,
          name: 'Gear Care - PS'
        },
        {
          id: 100003661,
          name: 'Avalanche Safety Gear - PS'
        }
      ]
    });
  });
});

describe('Test /sizevalue/add', () => {
  test('it should return 200 response', async () => {
    const response = await request(app)
      .post('/api/v1/sizing/sizevalue/add')
      .set('Content-type', 'application/json')
      .send({ name: 'testing' });
    expect(response.body).toEqual({});
    expect(response.statusCode).toEqual(200);
  });
  test('it should return 400 response when name is not passed in the payload', async () => {
    const response = await request(app)
      .post('/api/v1/sizing/sizevalue/add')
      .set('Content-type', 'application/json')
      .send({ description: 'test-description' });
    expect(response.body.error[0]).toEqual('"name" is required');
    expect(response.statusCode).toEqual(400);
  });
});
