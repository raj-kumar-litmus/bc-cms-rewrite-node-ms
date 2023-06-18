const Joi = require('joi');

const { Status, CreateProcess, WorkflowKeysEnum } = require('./enums');

const stringOrArrayOfStrings = () =>
  Joi.alternatives().try(
    Joi.string().trim().allow(''),
    Joi.array().items(Joi.string().trim().allow(''))
  );

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

const createWorkflowsDto = Joi.object({
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

const createWorkflowDto = Joi.object({
  styleId: Joi.string().required(),
  brand: Joi.string(),
  title: Joi.string()
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

const techSpecSchema = Joi.object({
  labelId: Joi.number().required(),
  order: Joi.number().required(),
  label: Joi.string().required(),
  value: Joi.string().required()
});

const harmonizingAttributeValueSchema = Joi.object({
  id: Joi.number().required(),
  text: Joi.string().required()
});

const harmonizingAttributeSchema = Joi.object({
  id: Joi.number().required(),
  text: Joi.string().required(),
  harmonizingAttributeValues: Joi.array().items(harmonizingAttributeValueSchema).required()
});

const workflowDetailsDto = Joi.object({
  genus: Joi.object({
    id: Joi.number().optional(),
    name: Joi.string().optional()
  }).optional(),
  species: Joi.object({
    id: Joi.number().optional(),
    name: Joi.string().optional()
  }).optional(),
  harmonizingAttributes: Joi.array().items(harmonizingAttributeSchema).allow(null).optional(),
  techSpecs: Joi.array().items(techSpecSchema).optional(),
  productTitle: Joi.string().empty('').optional(),
  topLine: Joi.string().empty('').optional(),
  detailedDescription: Joi.string().empty('').optional(),
  listDescription: Joi.string().empty('').optional(),
  bulletPoints: Joi.array().items(Joi.string().empty('')).optional(),
  competitiveCyclistTopline: Joi.string().empty('').optional(),
  competitiveCyclistDescription: Joi.string().empty('').optional(),
  versionReason: Joi.string().empty('').optional(),
  isPublished: Joi.boolean().optional(),
  isQuickFix: Joi.boolean().optional(),
  auditType: Joi.string().empty('').optional(),
  version: Joi.number().required(),
  attributeLastModified: Joi.string().required(),
  copyLastModified: Joi.string().required()
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
  unique: Joi.string().valid(...Object.values(UniqueKeysEnum))
});

module.exports = {
  assignWorkflowDto,
  createWorkflowDto,
  createWorkflowsDto,
  searchWorkflowBodyDto,
  searchWorkflowQueryDto,
  workflowDetailsDto
};
