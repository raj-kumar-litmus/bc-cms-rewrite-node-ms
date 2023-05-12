const notFound = (req, res, next) => {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
};

const errorHandler = (err, req, res) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
};

const validateMiddleware = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  return next();
};

const responseInterceptor = (_, res, next) => {
  const originalJson = res.json;

  res.json = function responseJson(data) {
    const response = {
      ok: true,
      data
    };
    originalJson.call(this, response);
  };

  const originalStatus = res.status;

  res.status = function responseStatus(code, ...args) {
    if (code >= 400) {
      const response = {
        ok: false,
        error: 'An error occurred'
      };
      originalJson.call(this, response);
    }
    return originalStatus.apply(this, args);
  };

  next();
};

module.exports = {
  notFound,
  errorHandler,
  validateMiddleware,
  responseInterceptor
};
