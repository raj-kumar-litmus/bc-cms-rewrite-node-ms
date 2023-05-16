const Joi = require('joi');

const { Status } = require('./enums');

const createWorkflowDto = Joi.object({
  styles: Joi.array()
    .items(
      Joi.object({
        styleId: Joi.string().required(),
        brand: Joi.string(),
        title: Joi.string()
      })
    )
    .min(1)
    .required()
});

const updatedWorkflowDto = Joi.object({
  status: Joi.string().valid(...Object.values(Status)),
  brand: Joi.string(),
  title: Joi.string()
});

module.exports = {
  createWorkflowDto,
  updatedWorkflowDto
};
