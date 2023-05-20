const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

const app = require('../src/app');

const prisma = new PrismaClient();
describe('Workflow API', () => {
  const url = '/api/v1/workflows';

  const validStyles = [
    { styleId: 'STYLE001', brand: 'Brand A', title: 'Title A' }
    // { styleId: 'STYLE002', brand: 'Brand B', title: 'Title B' },
    // { styleId: 'STYLE003', brand: 'Brand C', title: 'Title C' }
  ];

  const invalidStyles = [
    { styleId: 'STY', brand: 'Brand H', title: 'Title H' }
  ];

  const existingStyles = [validStyles[0]];
  let workflowId;

  describe('POST /', () => {
    it('should create workflows for valid styles', async () => {
      const response = await request(app).post(url).send({
        styles: validStyles
      });

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        success: validStyles.map(({ styleId }) => styleId),
        invalid: [],
        existing: []
      });
      workflowId = response.body.data.id;
    });

    it('should handle existing styles', async () => {
      const styles = [...existingStyles];

      const response = await request(app).post(url).send({ styles });

      const expectedResponse = {
        success: [],
        invalid: [],
        existing: ['STYLE001']
      };

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expectedResponse);
    });

    it('should handle invalid styleId', async () => {
      const styles = [...invalidStyles];

      const response = await request(app).post(url).send({ styles });

      const expectedResponse = {
        success: [],
        invalid: invalidStyles.map(({ styleId }) => styleId),
        existing: []
      };

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expectedResponse);
    });
  });

  describe('POST /search', () => {
    it('should return workflows matching the filters', async () => {
      const response = await request(app)
        .post(`${url}/search?page=1&limit=5`)
        .send({
          filters: {
            brand: ['Brand A'],
            title: ['Title A']
          }
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.workflows).toHaveLength(1);
      expect(response.body.data.pagination.total).toBe(1);
      expect(response.body.data.pagination.pageCount).toBe(1);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.currentPageCount).toBe(1);
    });

    it('should return empty workflows when no filters match', async () => {
      const response = await request(app)
        .post(`${url}/search?page=1&limit=5`)
        .send({
          filters: {
            brand: ['Brand-X']
          }
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.workflows).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
      expect(response.body.data.pagination.pageCount).toBe(0);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.currentPageCount).toBe(0);
    });

    it('should handle invalid page or limit values', async () => {
      const response = await request(app)
        .post(`${url}/search?page=invalid&limit=invalid`)
        .send({
          filters: {
            brand: ['Brand A'],
            title: ['Title A']
          }
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe('Invalid page or limit value.');
    });

    it('should throw error on unknown filter parameters', async () => {
      const response = await request(app)
        .post(`${url}/search?page=1&limit=5`)
        .send({
          filters: {
            brand: ['Brand A'],
            title: ['Title A'],
            invalidParam: 'value'
          }
        });

      expect(response.statusCode).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('"filters.invalidParam" is not allowed');
      expect(response.body.data).toBeUndefined();
    });

    it.skip('should handle errors while searching workflows', async () => {
      // Mock an error in the implementation
      jest
        .spyOn(prisma.workflow, 'findMany')
        .mockRejectedValueOnce(new Error('Search error'));

      const response = await request(app)
        .post(`${url}/search?page=1&limit=5`)
        .send({
          filters: {
            brand: ['Brand A'],
            title: ['Title A']
          }
        });

      expect(response.statusCode).toBe(500);
      expect(response.body.error).toBe(
        'An error occurred while searching workflows.'
      );

      // Restore the original implementation
      jest.spyOn(prisma.workflow, 'findMany').mockRestore();
    });
  });

  describe('Delete /:id', () => {
    it('should delete an existing workflow', async () => {
      // for (const { styleId } of validStyles) {
      await request(app).delete(`${url}/${workflowId}`).expect(200);
      // }
    });
  });
});

// After all the test cases, disconnect the Prisma client
afterAll(async () => {
  await prisma.$disconnect();
});

// describe('Workflow API', () => {
//   let styles = [
//     {
//       styleId: 'Test1'.toUpperCase(),
//       brand: 'My Brand1',
//       title: 'My product title1'
//     },
//     {
//       styleId: 'Test1'.toUpperCase(),
//       brand: 'My Brand1',
//       title: 'My product title1'
//     }
//   ];

//   // Create Workflow Test Case
//   it('should create a new workflow', async () => {
//     const response = await request(app)
//       .post('/api/v1/workflows')
//       .send({
//         styles
//       })
//       .expect(201);

//     expect(response.body.success).toBe(true);
//   });

//   // Read Workflow Test Case
//   it.skip('should retrieve an existing workflow by ID', async () => {
//     const response = await request(app)
//       .get(`/api/v1/workflows/${styleId}`)
//       .expect(200);

//     expect(response.body.success).toBe(true);
//   });

//   // Update Workflow Test Case
//   it.skip('should update an existing workflow', async () => {
//     const updatedData = {
//       brand: 'Updated Brand Name',
//       title: 'Updated Workflow Title'
//     };

//     const response = await request(app)
//       .patch(`/api/v1/workflows/${styleId}`)
//       .send(updatedData)
//       .expect(200);

//     expect(response.body.success).toBe(true);

//     // expect(response.body.brand).toBe(updatedData.brand);
//     // expect(response.body.title).toBe(updatedData.title);
//   });

//   // Delete Workflow Test Case
//   it.skip('should delete an existing workflow', async () => {
//     await request(app).delete(`/api/v1/workflows/${styleId}`).expect(200);
//   });
// });
