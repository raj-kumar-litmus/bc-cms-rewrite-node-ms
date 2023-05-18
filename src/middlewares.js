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

module.exports = {
  notFound,
  // errorHandler,
  validateMiddleware,
  responseInterceptor
};
