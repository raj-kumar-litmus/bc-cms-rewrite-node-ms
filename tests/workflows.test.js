const request = require('supertest');
const app = require('../src/app');

describe('Workflow API', () => {
  let styles = [
    {
      styleId: 'Test1'.toUpperCase(),
      brand: 'My Brand1',
      title: 'My product title1'
    },
    {
      styleId: 'Test1'.toUpperCase(),
      brand: 'My Brand1',
      title: 'My product title1'
    }
  ];

  // Create Workflow Test Case
  it('should create a new workflow', async () => {
    const response = await request(app)
      .post('/api/v1/workflows')
      .send({
        styles
      })
      .expect(201);

    expect(response.body.styleId).toBe(styleId);
  });

  // Read Workflow Test Case
  it.skip('should retrieve an existing workflow by ID', async () => {
    const response = await request(app)
      .get(`/api/v1/workflows/${styleId}`)
      .expect(200);

    expect(response.body.styleId).toBe(styleId);
  });

  // Update Workflow Test Case
  it.skip('should update an existing workflow', async () => {
    const updatedData = {
      brand: 'Updated Brand Name',
      title: 'Updated Workflow Title'
    };

    const response = await request(app)
      .patch(`/api/v1/workflows/${styleId}`)
      .send(updatedData)
      .expect(200);

    expect(response.body.brand).toBe(updatedData.brand);
    expect(response.body.title).toBe(updatedData.title);
  });

  // Delete Workflow Test Case
  it.skip('should delete an existing workflow', async () => {
    await request(app).delete(`/api/v1/workflows/${styleId}`).expect(200);
  });
});
