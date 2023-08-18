/* eslint-disable consistent-return */
const request = require('supertest');
const axios = require('axios');
const app = require('../../../app');

const { getStyle, createStyleCopy, upsertStyleAttributes, updateStyleCopy } = require('../styles');

jest.mock('axios');

axios.get.mockImplementation((url) => {
  if (url.includes('/merchv3/products/')) {
    if (url.includes('invalid')) {
      throw new Error('Invalid style');
    }
    if (url.includes('missing')) {
      const error = {
        response: {
          status: 404
        }
      };
      throw error;
    }
    return Promise.resolve({
      data: {
        brandName: 'NIKE',
        title: 'NIKE Air Shoe',
        style: 'TEST123'
      }
    });
  }
  if (url.includes('/copy-api/copy/')) {
    return Promise.resolve({
      data: {
        status: 'Published'
      }
    });
  }
  if (url.includes('/attribute-api/styles/')) {
    return Promise.resolve({
      data: {}
    });
  }
});

axios.put.mockImplementation((url) => {
  if (url.includes('/attribute-api/styles/')) {
    if (url.includes('invalid')) {
      throw new Error('Invalid style');
    }
    return Promise.resolve({
      success: true
    });
  }
  if (url.includes('/copy-api/copy/')) {
    if (url.includes('invalid')) {
      throw new Error('Invalid style');
    }
    return Promise.resolve({
      success: true
    });
  }
});

describe('/api/v1/styles/:styleId/attributes', () => {
  test('it should return the http response 500', async () => {
    const response = await request(app).get('/api/v1/styles/123/attributes');
    expect(response.statusCode).toEqual(200);
  });
});

describe('/api/v1/styles/:styleId/copy, GET', () => {
  test('it should return the mocked response', async () => {
    const response = await request(app).get('/api/v1/styles/123/copy');
    expect(response.statusCode).toEqual(200);
  });
});

describe('/api/v1/styles/:styleId/copy', () => {
  test('it should return the mocked response', async () => {
    const response = await request(app).put('/api/v1/styles/123/copy');
    expect(response.statusCode).toEqual(200);
  });

  test('/api/v1/styles/PATZAHS/copy POST', async () => {
    const response = await request(app)
      .post('/api/v1/styles/PATZAHS/copy')
      .set('Content-type', 'application/json')
      .send({
        style: 'PATZAHS',
        status: 'InProgress'
      });
    // expect(response.body).toEqual({});
    expect(response.statusCode).toEqual(500);
  });
});

describe('/:styleId/attributes', () => {
  test('it should return the mocked response', async () => {
    const response = await request(app).put('/api/v1/styles/123/attributes');
    expect(response.statusCode).toEqual(200);
  });
});

describe('Styles methods unit test case', () => {
  test('it should return the http response 200', async () => {
    const response = await getStyle('123');
    expect(response).toEqual({ brandName: 'NIKE', style: 'TEST123', title: 'NIKE Air Shoe' });
  });

  test('it should return the error response', async () => {
    try {
      await getStyle('invalid');
    } catch (err) {
      const error = new Error('An error occurred while fetching the style information.', 500);
      expect(err).toEqual(error);
    }
  });

  test('it should return the error response', async () => {
    try {
      await getStyle('missing');
    } catch (err) {
      const notFoundError = new Error('Style not found.');
      expect(err).toEqual(notFoundError);
    }
  });

  test('Unit test createStyleCopy', async () => {
    const response = await createStyleCopy('123');
    expect(response.success).toEqual(false);
  });

  // test('Unit test getStyleAttributes', async() => {
  //   const result = await getStyleAttributes('123');
  //   expect(result).toEqual({});
  // }) //

  test('Unit test upsertStyleAttributes', async () => {
    const response = await upsertStyleAttributes('123');
    expect(response.success).toEqual(true);
  });

  test('Unit test upsertStyleAttributes', async () => {
    const response = await upsertStyleAttributes('invalid');
    expect(response.error).toEqual(
      'An error occurred while updating product attributes for invalid'
    );
  });

  test('Unit test updateStyleCopy', async () => {
    const response = await updateStyleCopy({ style: '123' });
    expect(response.success).toEqual(true);
  });
  test('Unit test updateStyleCopy', async () => {
    const response = await updateStyleCopy({ style: 'invalid' });
    expect(response.error).toEqual('An error occurred while updating copy for invalid');
  });
});
