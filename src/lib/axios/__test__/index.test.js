const { AxiosInterceptor } = require('../index');

describe('Axios Interceptor', () => {
  it('return response with duration', async () => {
    const response = await AxiosInterceptor.get('https://www.backcountry.com');
    expect(response.status).toEqual(200);
    expect(response.duration).toBeDefined();
  });
  it('throw error', async () => {
    try {
      await AxiosInterceptor.get('https://www.backkkkcountry.com');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
});
