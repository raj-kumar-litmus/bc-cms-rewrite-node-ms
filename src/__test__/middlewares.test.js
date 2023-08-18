const { authorize, authenticationMiddleware, notFound } = require('../middlewares');

describe('Middleware methods', () => {
  it('return error in next method', () => {
    const statusMock = jest.fn();
    const nextMock = jest.fn();
    const req = {
      user: {
        groups: ['sizing-group', 'editor-group']
      },
      originalUrl: 'an/invalid/route'
    };
    const res = {
      sendResponse: () => {},
      status: statusMock
    };
    const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
    notFound(req, res, nextMock);
    expect(nextMock).toHaveBeenCalledWith(error);
    expect(statusMock).toHaveBeenCalledWith(404);
  });

  it('should call next when user has permissions', () => {
    const req = {
      user: {
        groups: ['sizing-group', 'editor-group']
      }
    };
    const res = {
      sendResponse: () => {}
    };
    const nextMock = jest.fn();
    authorize(['sizing-group'])(req, res, nextMock);
    expect(nextMock).toHaveBeenCalled();
  });

  it('should return 401 next when user does not have permissions', () => {
    const req = {
      user: {
        groups: ['sizing-group', 'editor-group']
      }
    };
    const sendResponseMock = jest.fn();
    const res = {
      sendResponse: sendResponseMock
    };
    const nextMock = jest.fn();
    authorize(['admin-group'])(req, res, nextMock);
    expect(sendResponseMock).toHaveBeenCalledWith('Unauthorized', 401);
  });

  it('should return 401 next when invalid token is passed', () => {
    const req = {
      user: {
        groups: ['sizing-group', 'editor-group']
      },
      headers: {
        authorization: 'Not-a-JWT-token'
      }
    };
    const sendResponseMock = jest.fn();
    const res = {
      sendResponse: sendResponseMock
    };
    const nextMock = jest.fn();
    authenticationMiddleware(req, res, nextMock);
    expect(sendResponseMock).toHaveBeenCalledWith('Invalid token', 401);
  });

  it('should return 401 next when expired token is passed', () => {
    const req = {
      user: {
        groups: ['sizing-group', 'editor-group']
      },
      headers: {
        authorization:
          'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ii1LSTNROW5OUjdiUm9meG1lWm9YcWJIWkdldyJ9.eyJhdWQiOiIzMWYyY2Q2NS1mZTE2LTRiNjQtOGNiZi1jYjMwNTVmNTQxNWMiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vZDMyYjdjM2EtYzVlMS00ZGQzLWI5NzMtM2Q2YTM2YjA1OGIyL3YyLjAiLCJpYXQiOjE2OTIyNTU0MzMsIm5iZiI6MTY5MjI1NTQzMywiZXhwIjoxNjkyMjU5MzMzLCJncm91cHMiOlsicHJvZHVjdC1jb250ZW50LWFkbWluIl0sIm5hbWUiOiJQcm9kdWN0IENvbnRlbnQgQWRtaW4iLCJub25jZSI6IjFjOWY1NGQwLWNjZmUtNDkxNC04NDU5LWQ2NmNmNzcxYTE0MiIsIm9pZCI6IjE1NDY0NjkzLWQxYjktNGQwNC1hMjQ5LTBkNmVmOTlkNjQ3MCIsInByZWZlcnJlZF91c2VybmFtZSI6InBjLmFkbWluQGJhY2tjb3VudHJ5LmNvbSIsInJoIjoiMC5BUmdBT253cjAtSEYwMDI1Y3oxcU5yQllzbVhOOGpFV19tUkxqTF9MTUZYMVFWd1lBSXMuIiwic3ViIjoicVVZZmdIUEVXZlVoeUY4WW56eWhQelRyZkxMZU84dHhQcXFGWktLWTA1VSIsInRpZCI6ImQzMmI3YzNhLWM1ZTEtNGRkMy1iOTczLTNkNmEzNmIwNThiMiIsInV0aSI6IkZzRmFCYl9UejBTLXNDQU40QUxTQUEiLCJ2ZXIiOiIyLjAifQ.alz4N2i-OSSnFXzVqnVHckDmwam3YX028LjTDkzfkRVaJHUj84_p1T80N0gmb9vMlmwMpWa6i52yw-Xy6UgnVTfEZm3MZpqo32rV8zFWJQ_ZrZfMgmyhD2HbLZxoeoR2_dXcJYMjtlJxyxCiayA2SL7t1e-KcUHp7v1XTItCUE3Xl34_uOENhdwcfWiYnS6Z7la4fSo4NF69kd6HlNa2KSaLJJ6m0Og2lRdha8M4HH5EzXRR7iAhIaJAMrdoHzRl771XIEt1nxpsRoBV60Xrca6Y2vZWCiO1-JWI2BzN6QDCOcowI8kEuB79YQv6fsfK_68ruiyPs6UqyK_iKI2TcQ'
      }
    };
    const sendResponseMock = jest.fn();
    const res = {
      sendResponse: sendResponseMock
    };
    const nextMock = jest.fn();
    authenticationMiddleware(req, res, nextMock);
    expect(sendResponseMock).toHaveBeenCalledWith('Token has expired', 401);
  });

  it('should return 401 unauthorized when no token is passed', () => {
    const req = {
      user: {
        groups: ['sizing-group', 'editor-group']
      },
      headers: {
        authorization: null
      }
    };
    const sendResponseMock = jest.fn();
    const res = {
      sendResponse: sendResponseMock
    };
    const nextMock = jest.fn();
    authenticationMiddleware(req, res, nextMock);
    expect(sendResponseMock).toHaveBeenCalledWith('Unauthorized', 401);
  });
});
