/* eslint-disable consistent-return */
const axios = require('axios');
const { whereBuilder, deepCompare, createWorkflow } = require('../utils');

jest.mock('axios');

axios.get.mockImplementation((url) => {
  if (url.includes('/merchv3/products/ABCDEF')) {
    return Promise.resolve({
      data: [
        {
          brandName: 'Nike',
          title: 'Nike Air Shoes'
        }
      ]
    });
  }
});

jest.mock('../../../../prisma/node_modules/.prisma/client/mongo', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    workflow: {
      create: () => ({
        _id: '124567'
      })
    }
  }))
}));

describe('Testing whereBuilder', () => {
  test('returns expected response', () => {
    expect(
      whereBuilder({
        id: 'test-id'
      })
    ).toEqual({ id: { in: ['test-id'] } });
  });
  test('returns expected response', () => {
    expect(
      whereBuilder({
        globalSearch: 'test-id'
      })
    ).toEqual({
      OR: [
        {
          styleId: { contains: 'test-id', mode: 'insensitive' }
        },
        {
          brand: { contains: 'test-id', mode: 'insensitive' }
        },
        {
          title: { contains: 'test-id', mode: 'insensitive' }
        }
      ]
    });
  });
  test('returns expected response', () => {
    expect(
      whereBuilder({
        globalSearch: ['test-id', 'test-id-1']
      })
    ).toEqual({
      OR: {
        OR: [
          {
            styleId: {
              in: ['test-id', 'test-id-1'],
              mode: 'insensitive'
            }
          },
          {
            brand: {
              in: ['test-id', 'test-id-1'],
              mode: 'insensitive'
            }
          },
          {
            title: {
              in: ['test-id', 'test-id-1'],
              mode: 'insensitive'
            }
          }
        ]
      }
    });
  });
  test('returns expected response', () => {
    expect(
      whereBuilder({
        excludeId: 'test-id'
      })
    ).toEqual({ id: { notIn: 'test-id' } });
  });
  test('returns expected response', () => {
    expect(
      whereBuilder({
        lastUpdateTs: '12345'
      })
    ).toEqual({
      lastUpdateTs: { gte: '+012344-12-31T18:30:00.000Z', lt: '+012345-01-01T18:29:59.999Z' }
    });
  });
  test('returns expected response', () => {
    expect(
      whereBuilder({
        status: 'WAITING_FOR_WRITER'
      })
    ).toEqual({ status: { contains: 'WAITING_FOR_WRITER', mode: undefined } });
  });
  test('returns expected response', () => {
    expect(
      whereBuilder({
        status: ['WAITING_FOR_WRITER', 'ASSIGNED_TO_WRITER']
      })
    ).toEqual({ status: { in: ['WAITING_FOR_WRITER', 'ASSIGNED_TO_WRITER'], mode: undefined } });
  });
  test('returns expected response', () => {
    expect(
      whereBuilder({
        assignee: 'pc.admin@backcountry.com'
      })
    ).toEqual({ assignee: { contains: 'pc.admin@backcountry.com', mode: 'insensitive' } });
  });
  test('returns expected response', () => {
    expect(
      whereBuilder({
        assignee: ['pc.admin@backcountry.com', 'pc.writer@backcountry.com']
      })
    ).toEqual({
      assignee: {
        in: ['pc.admin@backcountry.com', 'pc.writer@backcountry.com'],
        mode: 'insensitive'
      }
    });
  });
});

describe('Testing deepCompare', () => {
  test('returns expected response', () => {
    expect(deepCompare({}, { id: 'test-id' })).toEqual({
      id: { newValue: 'test-id', oldValue: null }
    });
  });
  test('returns expected response', () => {
    expect(deepCompare({ id: 'test-id-1' }, { id: 'test-id' })).toEqual({
      id: { newValue: 'test-id', oldValue: 'test-id-1' }
    });
  });
  test('returns expected response', () => {
    expect(
      deepCompare({ id: 'test-id-1', styleId: 'ABCDE' }, { id: 'test-id', styleId: 'ABCDEF' })
    ).toEqual({
      id: { newValue: 'test-id', oldValue: 'test-id-1' },
      styleId: { newValue: 'ABCDEF', oldValue: 'ABCDE' }
    });
  });
  test('returns expected response', () => {
    expect(
      deepCompare({ id: 'test-id-1', styleId: 'ABCDE' }, { id: 'test-id', styleId: 'ABCDE' }, [
        'styleId'
      ])
    ).toEqual({
      id: { newValue: 'test-id', oldValue: 'test-id-1' }
    });
  });
  test('returns expected response', () => {
    expect(deepCompare({ id: null, styleId: 'ABCDE' }, { id: null, styleId: 'ABCDE' })).toEqual({});
  });
  test('tothrow error', () => {
    try {
      deepCompare({ id: 'test-id-1', styleId: 'ABCDE' }, []);
    } catch (err) {
      expect(err.message).toEqual('Cannot convert undefined or null to object');
    }
  });
  test('tothrow error', () => {
    try {
      deepCompare({ id: 'test-id-1', styleId: 'ABCDE' }, '');
    } catch (err) {
      expect(err.message).toEqual('obj2 must be a valid object');
    }
  });
  test('returns expected response', () => {
    expect(deepCompare(null, { id: 'test-id', styleId: 'ABCDE' }, ['styleId'])).toEqual({
      id: {
        newValue: 'test-id',
        oldValue: null
      }
    });
  });
  test('returns expected response', () => {
    expect(
      deepCompare(
        { id: 'test-id-1', styleId: ['ABCDE', 'DEFGH'] },
        { id: 'test-id', styleId: ['ABCDE', 'DE'] }
      )
    ).toEqual({
      id: {
        newValue: 'test-id',
        oldValue: 'test-id-1'
      },
      styleId: {
        newValue: ['ABCDE', 'DE'],
        oldValue: ['ABCDE', 'DEFGH']
      }
    });
  });
  test('returns expected response', () => {
    expect(
      deepCompare(
        { id: { _id: 'test-id-1' }, styleId: ['ABCDE', 'DEFGH'] },
        { id: { _id: 'test-id' }, styleId: ['ABCDE', 'DE'] }
      )
    ).toEqual({
      id: { _id: { newValue: 'test-id', oldValue: 'test-id-1' } },
      styleId: { newValue: ['ABCDE', 'DE'], oldValue: ['ABCDE', 'DEFGH'] }
    });
  });
});

describe('Testing createWorkFlow', () => {
  test('returns expected response', async () => {
    const response = await createWorkflow({
      styleId: 'ABCDEF'
    });
    expect(response).toEqual({
      workflow: {
        _id: '124567'
      }
    });
  });
});
