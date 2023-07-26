const Joi = require('joi');

const sizeSchema = Joi.object({
  id: Joi.number().integer(),
  description: Joi.string().required(),
  name: Joi.string().required(),
  position: Joi.number().integer()
});

const scaleSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  sizes: Joi.array().items(sizeSchema)
});

const createSizeValueDto = Joi.object({
  name: Joi.string().required(),
  description: Joi.string()
});

const sizeMappingSchema = Joi.object({
  sizeId: Joi.number().required(),
  preferredSizeId: Joi.number().required()
});

const arrayOfSizeMappingsSchema = Joi.array().items(sizeMappingSchema);

const getSizeMappingDto = Joi.object({
  prefferedscale: Joi.string().required(),
  standardscale: Joi.string().required()
});

const getStandardScaleDto = Joi.object({
  prefferedscaleid: Joi.string().required()
});

module.exports = {
  getSizeMappingDto,
  getStandardScaleDto,
  arrayOfSizeMappingsSchema,
  sizeSchema,
  scaleSchema,
  createSizeValueDto,
  sizeMappingSchema
};
