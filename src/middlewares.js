const notFound = (req, res, next) => {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
};

// const errorHandler = (err, req, res) => {
//   const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
//   res.status(statusCode);
//   res.json({
//     message: err.message,
//     stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
//   });
// };

const validateMiddleware = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.sendResponse(error.details[0].message, 400);
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
