const Joi = require('joi');

const { Status } = require('./enums');

const createWorkflowDto = Joi.object({
  styleId: Joi.string().required(),
  brand: Joi.string().required(),
  title: Joi.string().required()
});

const updatedWorkflowDto = Joi.object({
  status: Joi.string()
    .valid(...Object.values(Status))
    .required()
});

module.exports = {
  createWorkflowDto,
  updatedWorkflowDto
};
