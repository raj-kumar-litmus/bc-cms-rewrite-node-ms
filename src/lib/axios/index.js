const axios = require('axios');

axios.interceptors.request.use(
  (req) => {
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
    return Promise.reject(err);
  }
);

module.exports = {
  AxiosInterceptor: axios
};
