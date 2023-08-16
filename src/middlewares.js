/* eslint-disable no-unused-vars */
const jwt = require('jsonwebtoken');
const { groups: groupNames, dummyAuth } = require('./properties');
const { logger } = require('./lib/logger');

const notFound = (req, res, next) => {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
};

// /* eslint-disable no-unused-vars */
// function errorHandler(err, req, res, next) {
//   /* eslint-enable no-unused-vars */
//   const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
//   res.sendResponse(
//     {
//       message: err.message,
//       stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
//     },
//     statusCode
//   );
//   next();
// }

const validateMiddleware = (schemas) => (req, res, next) => {
  /* eslint-disable consistent-return */
  /* eslint-disable indent */
  const getDataByType = (type) => {
    switch (type) {
      case 'params':
        return req.params;
      case 'query':
        return req.query;
      case 'body':
        return req.body;
      default:
        return null;
    }
  };

  /* eslint-disable consistent-return  */
  const validationErrors = Object.keys(schemas).map((key) => {
    const schema = schemas[key];
    const data = getDataByType(key);
    const { error } = schema.validate(data);

    if (error) {
      return error.details[0].message;
    }
    return null;
  });

  const hasErrors = validationErrors.some((error) => error !== null);

  if (hasErrors) {
    return res.sendResponse(
      validationErrors.filter((error) => error !== null),
      400
    );
  }

  return next();
};

const responseInterceptor = (req, res, next) => {
  const sendResponse = (dataOrError, statusCode = 200) => {
    let responseData;

    if (statusCode >= 400) {
      responseData = {
        success: false,
        error: dataOrError
      };
    } else {
      responseData = {
        success: true,
        data: dataOrError
      };
    }

    res.status(statusCode).json(responseData);
  };

  res.sendResponse = sendResponse;
  next();
};

const authenticationMiddleware = async (req, res, next) => {
  if (process.env.SKIP_AUTH === 'true') {
    try {
      const { username, email } = dummyAuth;
      if (!username || !email) {
        throw new Error('Invalid dummyAuth configuration');
      }

      req.user = {
        username,
        email,
        groups: [
          groupNames.ADMIN_GROUP_NAME,
          groupNames.EDITOR_GROUP_NAME,
          groupNames.WRITER_GROUP_NAME
        ]
      };
      next();
      return;
    } catch (error) {
      return res.sendResponse('Invalid dummyAuth configuration', 500);
    }
  }
  const token = req.headers.authorization;

  if (!token) {
    logger.error({ user: req?.user }, 'Api access denied due to invalid token');
    return res.sendResponse('Unauthorized', 401);
  }

  try {
    const decodedToken = jwt.decode(token.split(' ')[1], { complete: true });

    const { name, preferred_username: preferredUsername, groups, exp } = decodedToken.payload;

    if (Date.now() >= exp * 1000) {
      return res.sendResponse('Token has expired', 401);
    }

    req.user = {
      username: name,
      email: preferredUsername,
      groups
    };
    next();
  } catch (error) {
    logger.error({ user: req?.user }, 'Api access denied due to invalid token');
    return res.sendResponse('Invalid token', 401);
  }
};

const authorize = (allowedGroups) => (req, res, next) => {
  if (process.env.SKIP_AUTH === 'true') {
    next();
    return;
  }
  const userGroups = req.user.groups;
  const authorized = userGroups.some((userGroup) => allowedGroups.includes(userGroup));

  if (authorized) {
    next();
  } else {
    logger.error(
      { authorized, user: req?.user },
      'Api access denied due to insufficient credentials'
    );
    res.sendResponse('Unauthorized', 401);
  }
};

module.exports = {
  notFound,
  // errorHandler,
  validateMiddleware,
  responseInterceptor,
  authenticationMiddleware,
  authorize
};
