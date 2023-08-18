/* eslint-disable consistent-return,no-throw-literal */
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
      if (query.includes('select * from dn_sizes ds where ds.scaleid=')) {
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
      if (query.includes('SELECT smp.* FROM dn_sizemappings smp ')) {
        return [
          {
            id: 161
          },
          {
            id: 162
          },
          {
            id: 163
          },
          {
            id: 164
          }
        ];
      }
      if (query.includes('INSERT INTO dn_sizevalues(name,description) VALUES')) {
        return true;
      }
      if (query.includes('from DN_PreferredScales')) {
        return { scale: 'scale-123' };
      }
      if (query.includes('SELECT DISTINCT sc.id, sc.name FROM dn_sizemappings')) {
        return { scale: 'scale-456' };
      }
      if (
        query.includes(
          'select sz.id as standardScaleId, psz.id as prefferedScaleId, sz.description as standardScaleDescription, psz.description as prefferedScaleDescription from dn_sizemappings sm'
        )
      ) {
        return { mapping: '98765' };
      }
    },
    $disconnect: () => ({}),
    dn_scales: {
      create: (payload) => {
        const {
          data: { name }
        } = payload || {};
        if (name === 'throwError') {
          throw 'Invalid payload';
        } else {
          return {
            name: 'new_scale',
            id: 'new_scale_id'
          };
        }
      },
      update: (payload) => {
        const {
          data: { name }
        } = payload || {};
        if (name === 'throwError') {
          throw 'Invalid payload';
        } else if (name === 'recordNotFound') {
          const error = new Error("'Invalid payload'");
          error.code = 'P2025';
          throw error;
        } else {
          return {
            name: 'updated_scale',
            id: 'updated_scale_id'
          };
        }
      }
    },
    dn_preferredscales: {
      findFirst: (payload) => {
        const {
          where: { productgroup }
        } = payload;
        if (productgroup === 99999) {
          throw 'Invalid Product group';
        } else {
          return {
            name: 'scale',
            id: 'scale_id'
          };
        }
      },
      upsert: () => {
        return {
          name: 'upserted_scale',
          id: 'upserted_scale_id'
        };
      }
    },
    dn_sizemappings: {
      create: () => ({}),
      deleteMany: (payload) => {
        const {
          where: {
            id: { in: mappingIds }
          }
        } = payload;
        if (mappingIds.includes(987654)) {
          throw 'Invalid mapping';
        } else {
          return {};
        }
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
          id: 100003661,
          name: 'Avalanche Safety Gear - PS'
        },
        {
          id: 200004187,
          name: 'Gear Care - PS'
        }
      ]
    });
  });
  test('it should throw error', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/merchv3/light-product-groups')) {
        throw new Error({
          stack: 'invalid',
          message: 'api not responsive'
        });
      }
    });
    const response = await request(app).get('/api/v1/sizing/productgroups');
    expect(response.body.error).toEqual('Internal Server Error');
  });
});

describe('Test /sizevalue/add', () => {
  test('it should return 200 response', async () => {
    const response = await request(app)
      .post('/api/v1/sizing/sizevalue/add')
      .set('Content-type', 'application/json')
      .send({ name: 'testing' });
    expect(response.body.data).toEqual({});
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

describe('Test /scales', () => {
  test('it should return 200 response', async () => {
    const response = await request(app)
      .post('/api/v1/sizing/scales')
      .set('Content-type', 'application/json')
      .send({ name: 'testing', description: 'test-description' });
    expect(response.body.data).toEqual({
      name: 'new_scale',
      id: 'new_scale_id'
    });
    expect(response.statusCode).toEqual(201);
  });
  test('it should throw error when invalid payload is passed', async () => {
    const response = await request(app)
      .post('/api/v1/sizing/scales')
      .set('Content-type', 'application/json')
      .send({ name: 'throwError', description: 'test-description' });
    expect(response.body.error).toEqual('Error occurred while creating the scale');
    expect(response.statusCode).toEqual(500);
  });
  test('it should return 400 response when name is not passed in the payload', async () => {
    const response = await request(app)
      .post('/api/v1/sizing/scales')
      .set('Content-type', 'application/json')
      .send({ description: 'test-description' });
    expect(response.body.error[0]).toEqual('"name" is required');
    expect(response.statusCode).toEqual(400);
  });
});

describe('Test /scales/:scaleId', () => {
  test('it should return 200 response', async () => {
    const response = await request(app)
      .put('/api/v1/sizing/scales/123')
      .set('Content-type', 'application/json')
      .send({
        name: 'testing',
        description: 'test-description',
        sizes: [
          {
            id: 1234,
            description: 'test-description',
            name: 'test-name',
            position: 1
          }
        ]
      });
    expect(response.body.data).toEqual({
      name: 'updated_scale',
      id: 'updated_scale_id'
    });
    expect(response.statusCode).toEqual(200);
  });
  test('it should throw error when invalid payload is passed', async () => {
    const response = await request(app)
      .put('/api/v1/sizing/scales/123')
      .set('Content-type', 'application/json')
      .send({
        name: 'throwError',
        description: 'test-description',
        sizes: [
          {
            id: 1234,
            description: 'test-description',
            name: 'test-name',
            position: 1
          }
        ]
      });
    expect(response.body.error).toEqual('Error occurred while updating the scale');
    expect(response.statusCode).toEqual(500);
  });
  test('it should throw error when invalid payload is passed', async () => {
    const response = await request(app)
      .put('/api/v1/sizing/scales/123')
      .set('Content-type', 'application/json')
      .send({
        name: 'recordNotFound',
        description: 'test-description',
        sizes: [
          {
            id: 1234,
            description: 'test-description',
            name: 'test-name',
            position: 1
          }
        ]
      });
    expect(response.body.error).toEqual('Scale not found');
    expect(response.statusCode).toEqual(404);
  });
  test('it should return 400 response when sizes passed in the payload is not an array', async () => {
    const response = await request(app)
      .put('/api/v1/sizing/scales/123')
      .set('Content-type', 'application/json')
      .send({
        name: 'testing',
        description: 'test-description',
        sizes: {
          description: 'test-description',
          name: 'test-name',
          position: 1
        }
      });
    expect(response.body.error[0]).toEqual('"sizes" must be an array');
    expect(response.statusCode).toEqual(400);
  });
});

describe('Test /productgroups/:productgroupId/preferredScale/:scaleId', () => {
  test('it should return 200 response', async () => {
    const response = await request(app)
      .put('/api/v1/sizing/productgroups/1234/preferredScale/5678')
      .set('Content-type', 'application/json')
      .send({
        name: 'testing',
        description: 'test-description',
        sizes: [
          {
            id: 1234,
            description: 'test-description',
            name: 'test-name',
            position: 1
          }
        ]
      });
    expect(response.body.data).toEqual({
      name: 'upserted_scale',
      id: 'upserted_scale_id'
    });
    expect(response.statusCode).toEqual(201);
  });
  test('it should throw error when invalid payload is passed', async () => {
    const response = await request(app)
      .put('/api/v1/sizing/productgroups/99999/preferredScale/5678')
      .set('Content-type', 'application/json')
      .send({
        name: 'throwError',
        description: 'test-description',
        sizes: [
          {
            id: 1234,
            description: 'test-description',
            name: 'test-name',
            position: 1
          }
        ]
      });
    expect(response.body.error).toEqual('Error occurred while updating the preferred Scale');
    expect(response.statusCode).toEqual(500);
  });
});

describe('Test /productgroups/:productgroupId/preferredScale/:scaleId', () => {
  test('it should return 200 response', async () => {
    const response = await request(app)
      .post('/api/v1/sizing/sizeMapping/11/22')
      .set('Content-type', 'application/json')
      .send([
        {
          sizeId: 123,
          preferredSizeId: 345
        }
      ]);
    expect(response.body).toEqual({ success: true });
    expect(response.statusCode).toEqual(200);
  });
});

describe('Test /prefferedscale', () => {
  test('it should return 200 response', async () => {
    const response = await request(app).get('/api/v1/sizing/prefferedscale');
    expect(response.body.data).toEqual({
      prefferedscale: { scale: 'scale-123' }
    });
    expect(response.statusCode).toEqual(200);
  });
});

describe('Test /standardscale', () => {
  test('it should return 200 response', async () => {
    const response = await request(app).get('/api/v1/sizing/standardscale/1234');
    expect(response.body.data).toEqual({
      standardScales: {
        scale: 'scale-456'
      }
    });
    expect(response.statusCode).toEqual(200);
  });
});

describe('Test/sizemapping/preferredscale/:prefferedscale/standardscale/:standardscale', () => {
  test('it should return 200 response', async () => {
    const response = await request(app).get(
      '/api/v1/sizing/sizemapping/preferredscale/1234/standardscale/4567'
    );
    expect(response.body.data).toEqual({ sizeMapping: { mapping: '98765' } });
    expect(response.statusCode).toEqual(200);
  });
});

describe('Test delete /sizeMapping/:preferredScaleId', () => {
  test('it should return 200 response', async () => {
    const response = await request(app)
      .delete('/api/v1/sizing/sizeMapping/123456')
      .set('Content-type', 'application/json')
      .send([1, 2, 3, 4]);
    expect(response.body.data).toEqual('Size mappings deleted successfully');
    expect(response.statusCode).toEqual(200);
  });
});
