const Joi = require('joi');

const { Status, CreateProcess, WorkflowKeysEnum } = require('./enums');

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

const searchWorkflowBodyDto = Joi.object({
  filters: Joi.object({
    styleId: Joi.string(),
    title: Joi.string(),
    brand: Joi.array().items(Joi.string().trim()),
    status: Joi.array().items(Joi.string().valid(...Object.values(Status))),
    createProcess: Joi.array().items(
      Joi.string().valid(...Object.values(CreateProcess))
    ),
    lastUpdateTs: Joi.date(),
    assignee: Joi.string()
  }),
  orderBy: Joi.object({
    styleId: Joi.string().valid('asc', 'desc'),
    title: Joi.string().valid('asc', 'desc'),
    brand: Joi.string().valid('asc', 'desc'),
    status: Joi.string().valid('asc', 'desc'),
    createProcess: Joi.string().valid('asc', 'desc'),
    lastUpdateTs: Joi.string().valid('asc', 'desc'),
    assignee: Joi.string().valid('asc', 'desc')
  })
});

const UniqueKeysEnum = {
  id: WorkflowKeysEnum.id,
  styleId: WorkflowKeysEnum.styleId,
  brand: WorkflowKeysEnum.brand,
  title: WorkflowKeysEnum.title,
  status: WorkflowKeysEnum.status
};

const searchWorkflowQueryDto = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1),
  unique: Joi.string().valid(...Object.values(UniqueKeysEnum))
});

module.exports = {
  createWorkflowDto,
  updatedWorkflowDto,
  searchWorkflowBodyDto,
  searchWorkflowQueryDto
};
