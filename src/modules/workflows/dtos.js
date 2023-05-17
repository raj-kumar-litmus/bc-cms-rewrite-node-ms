const Joi = require('joi');

const { Status, CreateProcess } = require('./enums');

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

const searchWorkflowDto = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1),
  filters: Joi.object({
    styleId: Joi.array().items(Joi.string().trim()),
    title: Joi.array().items(Joi.string().trim()),
    brand: Joi.array().items(Joi.string().trim()),
    status: Joi.array().items(Joi.string().valid(...Object.values(Status))),
    createProcess: Joi.array().items(
      Joi.string().valid(...Object.values(CreateProcess))
    )
  })
});

module.exports = {
  createWorkflowDto,
  updatedWorkflowDto,
  searchWorkflowDto
};
