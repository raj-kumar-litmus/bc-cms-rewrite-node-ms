const Joi = require('joi');

const getStylesDto = Joi.object({
  styles: Joi.array().items(Joi.string()).min(1).required()
});

module.exports = {
  getStylesDto
};
