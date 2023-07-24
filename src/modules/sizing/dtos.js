const Joi = require('joi');

const createSizeValueDto = Joi.object({
  name: Joi.string().required(),
  description: Joi.string()
});

module.exports = {
  createSizeValueDto
};
