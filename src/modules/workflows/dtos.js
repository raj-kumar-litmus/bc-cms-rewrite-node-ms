const Joi = require('joi');

const { Status, CreateProcess, WorkflowKeysEnum } = require('./enums');

// Helper function to define a schema for string or array of strings
const stringOrArrayOfStrings = () =>
  Joi.alternatives().try(Joi.string().trim(), Joi.array().items(Joi.string()));

const enumValidator = (Enum) => {
  return Joi.alternatives().try(
    Joi.string()
      .trim()
      .valid(...Object.values(Enum)),
    Joi.array().items(
      Joi.string()
        .trim()
        .valid(...Object.values(Enum))
    )
  );
};

const sortValidator = () => {
  return Joi.string().valid('asc', 'desc');
};

// Validation schema for the "filters" object
const filtersSchema = Joi.object({
  id: Joi.alternatives().try(
    Joi.array().items(
      Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .trim()
    ),
    Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .trim()
  ),
  styleId: stringOrArrayOfStrings(),
  title: stringOrArrayOfStrings(),
  brand: stringOrArrayOfStrings(),
  status: enumValidator(Status),
  createProcess: enumValidator(CreateProcess),
  lastUpdateTs: Joi.date(),
  lastUpdatedBy: stringOrArrayOfStrings(),
  assignee: stringOrArrayOfStrings(),
  globalSearch: stringOrArrayOfStrings(),
  excludeId: Joi.alternatives().try(
    Joi.array().items(
      Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .trim()
    ),
    Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .trim()
  )
}).unknown(false);

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

const assignWorkflowDto = Joi.object({
  filters: filtersSchema,
  assignments: Joi.object({
    writer: Joi.string(),
    editor: Joi.string()
  })
    .or('writer', 'editor')
    .required()
});

const sortSchema = Joi.object().pattern(
  Joi.string().valid(...Object.values(WorkflowKeysEnum)),
  sortValidator()
);

const searchWorkflowBodyDto = Joi.object({
  filters: filtersSchema,
  orderBy: Joi.alternatives().try(sortSchema, Joi.array().items(sortSchema).min(1))
}).unknown(false);

const workflowDetailsDto = Joi.object({
  genus: Joi.string().optional(),
  species: Joi.string().optional(),
  harmonizingData: Joi.object({
    recommendedUse: Joi.array().items(Joi.string()).optional(),
    ropeDiameter: Joi.array().items(Joi.string()).optional(),
    type: Joi.array().items(Joi.string()).optional()
  }).optional(),
  techspecs: Joi.object({
    responsibleCollection: Joi.string().optional(),
    material: Joi.string().optional()
  }).optional(),
  productTitle: Joi.string().optional(),
  topLine: Joi.string().optional(),
  detailedDescription: Joi.string().optional(),
  listDescription: Joi.string().optional(),
  bulletPoints: Joi.string().optional(),
  sizingChart: Joi.string().optional(),
  competitiveCyclistTopline: Joi.string().optional(),
  competitiveCyclistDescription: Joi.string().optional(),
  versionReason: Joi.string().optional(),
  isPublished: Joi.boolean().optional()
});

const UniqueKeysEnum = {
  id: WorkflowKeysEnum.id,
  styleId: WorkflowKeysEnum.styleId,
  brand: WorkflowKeysEnum.brand,
  title: WorkflowKeysEnum.title,
  status: WorkflowKeysEnum.status,
  assignee: WorkflowKeysEnum.assignee,
  lastUpdatedBy: WorkflowKeysEnum.lastUpdatedBy,
  writer: WorkflowKeysEnum.writer,
  editor: WorkflowKeysEnum.editor,
  admin: WorkflowKeysEnum.admin
};

const searchWorkflowQueryDto = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1),
  unique: Joi.string().valid(...Object.values(UniqueKeysEnum)),
  globalSearch: Joi.string()
});

module.exports = {
  assignWorkflowDto,
  createWorkflowDto,
  searchWorkflowBodyDto,
  searchWorkflowQueryDto,
  workflowDetailsDto
};
