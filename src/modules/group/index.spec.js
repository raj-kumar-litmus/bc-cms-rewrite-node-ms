
// todo.
// 1. finish validate jwt api;
// 2. write test cases;
// 3. define folder structure.
// 4. migrate fetch member groups to backend.
// 5. build get members of groups in backend.
// 6. fix me token issue.
// https://dreamix.eu/blog/frontpage/node-js-project-structure-a-short-guide

const request = require('supertest');
const app = require('../../app.js');

describe('Group members API', () => {
  describe("should return members of the Azure AD group", () => {
    const url = '/api/v1/workflows';
  });
});