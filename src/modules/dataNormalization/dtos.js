const Joi = require('joi');

const getProductsDto = Joi.object({
  styles: Joi.array().items(Joi.string()).min(1).required()
});

module.exports = {
  getProductsDto
};
