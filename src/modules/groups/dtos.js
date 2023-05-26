const Joi = require('joi');

const UniqueKeysEnum = {
  editors: 'editors',
  writers: 'writers'
};

const groupDto = Joi.object({
  type: Joi.string().valid(...Object.values(UniqueKeysEnum))
});

module.exports = {
  groupDto
};
