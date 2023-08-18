/* eslint-disable consistent-return */
const axios = require('axios');
const { fetchGroupMembers } = require('../utils');

jest.mock('axios');

axios.get.mockImplementation((url) => {
  if (url.includes('/groups/group-123/members')) {
    return Promise.resolve({
      data: {
        value: {
          members: [
            {
              name: 'pc.admin@backcountry.com'
            },
            {
              name: 'pc.writer@backcountry.com'
            }
          ]
        }
      }
    });
  }
});

describe('fetchGroupMembers', () => {
  it('return expected response with duration', async () => {
    const response = await fetchGroupMembers('group-123');
    expect(response).toEqual({
      members: [
        {
          name: 'pc.admin@backcountry.com'
        },
        {
          name: 'pc.writer@backcountry.com'
        }
      ]
    });
  });
});
