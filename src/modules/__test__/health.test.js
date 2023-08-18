const { getHealth } = require('../health');

describe('Health api', () => {
  it('return expected response with duration', async () => {
    const responseMock = jest.fn();
    const res = {
      json: responseMock
    };
    await getHealth({}, res);
    expect(responseMock).toHaveBeenCalledWith({
      backCountryApis: [
        { name: 'attribute', status: 'HEALTHY', url: undefined },
        { name: 'copy', status: 'HEALTHY', url: undefined },
        { name: 'merch', status: 'HEALTHY', url: undefined },
        { name: 'sizing', status: 'HEALTHY', url: undefined }
      ],
      databases: { mongo: 'HEALTHY', postgres: 'HEALTHY' },
      status: 'HEALTHY'
    });
  });
});
