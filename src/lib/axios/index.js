const axios = require('axios');
const { logger } = require('../logger');

axios.interceptors.request.use(
  (req) => {
    req.timeout = 90000; // Wait for 90 seconds before timing out
    req.time = { startTime: new Date() };
    return req;
  },
  (err) => {
    return Promise.reject(err);
  }
);

axios.interceptors.response.use(
  (res) => {
    res.config.time.endTime = new Date();
    res.duration = res.config.time.endTime - res.config.time.startTime;
    return res;
  },
  (err) => {
    if (err.code === 'ECONNABORTED' && err.message.includes('timeout')) {
      const { stack } = err;
      logger.error({ err, stack }, 'API timed out after 90 seconds');
    }
    return Promise.reject(err);
  }
);

module.exports = {
  AxiosInterceptor: axios
};
