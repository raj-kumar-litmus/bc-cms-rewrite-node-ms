const request = require('supertest');
const app = require('../src/app');

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

  const duplicateStyles = [validStyles[0]];

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
        duplicates: []
      });
    });

    it('should handle duplicate styles', async () => {
      const styles = [...duplicateStyles];

      const response = await request(app).post(url).send({ styles });

      const expectedResponse = {
        success: [],
        invalid: [],
        duplicates: ['STYLE001']
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
        duplicates: []
      };

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expectedResponse);
    });
  });

  describe('Delete /:id', () => {
    it('should delete an existing workflow', async () => {
      for (const { styleId } of validStyles) {
        await request(app).delete(`${url}/${styleId}`).expect(200);
      }
    });
  });
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
