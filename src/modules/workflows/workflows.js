const express = require('express');
const https = require('https');

const { AxiosInterceptor } = require('../../lib/axios');
const { transformObject, constants, chunkArray } = require('../../utils');
const { validateMiddleware } = require('../../middlewares');
const { mongoPrisma } = require('../prisma');
const workflowEngine = require('./workflowEngine');
const { whereBuilder, deepCompare } = require('./utils');
const {
  CreateProcess,
  CopyStatus,
  Status,
  WorkflowAuditLogKeysEnum,
  WorkflowKeysEnum,
  WorkflowAuditType
} = require('./enums');
const {
  assignWorkflowDto,
  createWorkflowDto,
  createWorkflowsDto,
  searchWorkflowBodyDto,
  searchWorkflowQueryDto,
  workflowDetailsDto
} = require('./dtos');
const {
  getStyle,
  getStyleAttributes,
  upsertStyleAttributes,
  getStyleCopy,
  createStyleCopy,
  updateStyleCopy
} = require('../styles');
const { authorize } = require('../../middlewares');
const { groups } = require('../../properties');
const { logger } = require('../../lib/logger');

const { MERCH_API_DOMAIN_NAME, ATTRIBUTE_API_DOMAIN_NAME } = process.env;
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const router = express.Router();

const findWorkflowById = async (id) => {
  try {
    const workflow = await mongoPrisma.workflow.findUniqueOrThrow({
      where: {
        id
      }
    });

    return workflow;
  } catch (error) {
    console.error(error);

    if (error.code === 'P2023') {
      throw new Error('Invalid workflow ID.');
    }

    if (error.code === 'P2025') {
      const notFoundError = new Error('Workflow not found.');
      notFoundError.status = 404;
      throw notFoundError;
    }

    throw new Error('An error occurred while retrieving the workflow.');
  } finally {
    await mongoPrisma.$disconnect();
  }
};

// Endpoint to create a workflow
router.post(
  '/',
  authorize([groups.ADMIN_GROUP_NAME]),
  validateMiddleware({ body: createWorkflowDto }),
  async (req, res) => {
    try {
      const {
        body: { styleId },
        user: { email }
      } = req;

      const { brandName, title, style } = await getStyle(styleId);
      if (style !== styleId)
        logger.info({ styleId, style }, 'Mismatch between styles from UI and Merch api response');

      const transformedData = transformObject(
        {
          styleId: style,
          createProcess: CreateProcess.WRITER_INTERFACE,
          admin: email,
          lastUpdatedBy: email
        },
        {
          styleId: 'upperCase',
          admin: 'lowerCase',
          lastUpdatedBy: 'lowerCase'
        }
      );

      logger.info({ data: { ...transformedData, brand: brandName, title } }, 'Creating work flow');

      const workflow = await mongoPrisma.workflow.create({
        data: { ...transformedData, brand: brandName, title }
      });
      logger.info({ workflow }, 'Workflow created');
      return res.sendResponse({ success: workflow }, 201);
    } catch (error) {
      const { stack, message } = error;
      logger.error(
        { stack, message, error, styleId: req?.body?.styleId },
        'Error occured while creating workflow'
      );

      if (error.code === 'P2002') {
        return res.sendResponse('Workflow with the styleId already exists', 400);
      }

      return res.sendResponse(
        `An error occurred while creating the workflow for ${req?.body?.styleId}.`,
        error.status || 500
      );
    } finally {
      await mongoPrisma.$disconnect();
    }
  }
);

// Endpoint to create a mutliple workflows
router.post(
  '/bulk',
  authorize([groups.ADMIN_GROUP_NAME]),
  validateMiddleware({ body: createWorkflowsDto }),
  /* eslint-disable-next-line consistent-return */
  async (req, res) => {
    try {
      const {
        body: { styles: styleIds },
        user: { email }
      } = req;

      // const createdWorkflows = [];
      // const failedWorkflows = [];

      const chunkedStyleIds = chunkArray(styleIds, constants.CHUNK_SIZE_STYLE_SEARCH);

      let data = [];
      chunkedStyleIds.map(async (styles) => {
        styles.map(async ({ styleId, brand = '', title = '' }) => {
          const transformedData = transformObject(
            {
              styleId,
              brand,
              title,
              createProcess: CreateProcess.WRITER_INTERFACE,
              admin: email,
              lastUpdatedBy: email
            },
            {
              styleId: 'upperCase',
              brand: 'lowerCase',
              title: 'lowerCase',
              admin: 'lowerCase',
              lastUpdatedBy: 'lowerCase'
            }
          );
          data = data.concat(transformedData);
        });
      });

      const response = await mongoPrisma.workflow.createMany({
        data
      });

      return res.sendResponse({ data, response }, 201);
    } catch (err) {
      const { stack, message } = err;
      logger.error({ err, stack, message }, 'Error occured while creating workflows');
      return res.sendResponse('An error occurred while creating workflows.', 500);
    } finally {
      await mongoPrisma.$disconnect();
    }
  }
);

// Endpoint to search workflows
router.post(
  '/search',
  authorize([groups.ADMIN_GROUP_NAME, groups.WRITER_GROUP_NAME, groups.EDITOR_GROUP_NAME]),
  validateMiddleware({
    query: searchWorkflowQueryDto,
    body: searchWorkflowBodyDto
  }),
  async (req, res) => {
    try {
      const { page = 1, limit = 10, unique } = req.query;
      const { filters = {}, orderBy = {} } = req.body;
      const parsedLimit = parseInt(limit, 10);
      const parsedPage = parseInt(page, 10);

      if (Number.isNaN(parsedLimit) || Number.isNaN(parsedPage)) {
        return res.sendResponse('Invalid page or limit value.', 400);
      }

      const skip = (parsedPage - 1) * parsedLimit;

      const where = whereBuilder(filters);

      let workflows;
      let total = 0;
      let uniqueValues;

      logger.info({ body: req?.body, query: req?.query }, 'Searching for workflows');

      if (unique) {
        [uniqueValues, total] = await Promise.all([
          mongoPrisma.workflow.findMany({
            distinct: [unique],
            select: {
              [unique]: true
            },
            where,
            skip,
            orderBy: {
              [unique]: 'asc'
            },
            take: parsedLimit
          }),
          mongoPrisma.workflow
            .findMany({
              distinct: [unique],
              select: {
                [unique]: true
              },
              where
            })
            .then((result) => result.length)
            .catch(() => 0) // Set the default count to 0 in case of errors
        ]);
      } else {
        [workflows, total] = await Promise.all([
          mongoPrisma.workflow.findMany({
            where,
            orderBy,
            skip,
            take: parsedLimit
          }),
          mongoPrisma.workflow.count({ where })
        ]);
      }

      const pageCount = Math.ceil(total / parsedLimit);
      const currentPageCount = unique ? uniqueValues.length : workflows.length;

      return res.sendResponse({
        workflows,
        uniqueValues: uniqueValues?.map((obj) => obj[unique]),
        pagination: {
          total,
          pageCount,
          currentPage: parsedPage,
          currentPageCount
        }
      });
    } catch (error) {
      const { stack, message } = error;
      logger.error(
        { error, stack, message, body: req?.body, query: req?.query },
        'Error occured while searching for workflows'
      );
      return res.sendResponse('An error occurred while searching workflows.', 500);
    } finally {
      await mongoPrisma.$disconnect();
    }
  }
);

// Endpoint to fetch constants
router.get(
  '/constants',
  authorize([groups.ADMIN_GROUP_NAME, groups.WRITER_GROUP_NAME, groups.EDITOR_GROUP_NAME]),
  async (req, res) => {
    try {
      return res.sendResponse(
        {
          CreateProcess,
          Status,
          WorkflowKeysEnum,
          WorkflowAuditLogKeysEnum,
          WorkflowAuditType
        },
        200
      );
    } catch (error) {
      const { stack, message } = error;
      logger.error({ stack, message, error }, 'Error occured while fetching constants');
      return res.sendResponse('An error occurred while fetching constants.', 500);
    }
  }
);

// Endpoint to retrieve workflow counts
router.get(
  '/counts',
  authorize([groups.ADMIN_GROUP_NAME, groups.WRITER_GROUP_NAME, groups.EDITOR_GROUP_NAME]),
  async (req, res) => {
    try {
      const { email } = req.user;
      const isAdmin = req.user.groups.includes(groups.ADMIN_GROUP_NAME);

      const counts = {
        unassigned: await mongoPrisma.workflow.count({
          where: { status: Status.WAITING_FOR_WRITER }
        }),
        assigned: await mongoPrisma.workflow.count({
          where: {
            OR: [
              { status: Status.ASSIGNED_TO_WRITER, ...(!isAdmin && { assignee: email }) },
              { status: Status.ASSIGNED_TO_EDITOR, ...(!isAdmin && { assignee: email }) }
            ]
          }
        }),
        inProgress: await mongoPrisma.workflow.count({
          where: {
            OR: [
              { status: Status.WRITING_IN_PROGRESS, ...(!isAdmin && { assignee: email }) },
              { status: Status.EDITING_IN_PROGRESS, ...(!isAdmin && { assignee: email }) }
            ]
          }
        }),
        completed: await mongoPrisma.workflow.count({
          where: {
            OR: [
              { status: Status.WRITING_COMPLETE, ...(!isAdmin && { assignee: email }) },
              { status: Status.EDITING_COMPLETE, ...(!isAdmin && { assignee: email }) }
            ]
          }
        })
      };

      return res.sendResponse(counts);
    } catch (error) {
      const { stack, message } = error;
      logger.error(
        { stack, message, error, query: req?.query },
        'Error occured while fetching workflow counts'
      );
      return res.sendResponse('An error occurred while fetching workflow counts.', 500);
    } finally {
      await mongoPrisma.$disconnect();
    }
  }
);

// Endpoint to retrieve a specific workflow
router.get(
  '/:id',
  authorize([groups.ADMIN_GROUP_NAME, groups.WRITER_GROUP_NAME, groups.EDITOR_GROUP_NAME]),
  async (req, res) => {
    try {
      const { id } = req.params;
      logger.info({ id: req?.params?.id }, 'Retrieving a workflow');
      const workflow = await findWorkflowById(id);
      const workflowDeatils = await mongoPrisma.workbenchAudit.findFirst({
        where: {
          workflowId: id,
          auditType: WorkflowAuditType.DATA_NORMALIZATION
        },
        orderBy: {
          createTs: 'desc'
        }
      });

      return res.sendResponse({ workflow, workflowDeatils });
    } catch (error) {
      const { stack, message } = error;
      logger.error(
        { stack, message, error, id: req?.params?.id },
        'Error occured while retrieving a workflow'
      );
      return res.sendResponse(
        `Error occured while retrieving a workflow for ${req?.params?.id}`,
        error.status || 500
      );
    }
  }
);

// Endpoint to retrieve a specific workflow's history
router.get(
  '/:workflowId/history',
  authorize([groups.ADMIN_GROUP_NAME, groups.WRITER_GROUP_NAME, groups.EDITOR_GROUP_NAME]),
  async (req, res) => {
    const { workflowId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);

    if (Number.isNaN(parsedLimit) || Number.isNaN(parsedPage)) {
      return res.sendResponse('Invalid page or limit value.', 400);
    }

    const skip = (parsedPage - 1) * parsedLimit;

    try {
      const [auditLogs, total] = await Promise.all([
        mongoPrisma.workbenchAudit.findMany({
          select: {
            id: true,
            assignee: true,
            createdBy: true,
            createTs: true,
            auditType: true
          },
          where: {
            workflowId
          },
          skip,
          take: parsedLimit,
          orderBy: {
            createTs: 'desc'
          }
        }),
        mongoPrisma.workbenchAudit.count({
          where: {
            workflowId
          }
        })
      ]);
      logger.info(
        { auditLogs, workflowId, query: req?.query },
        'Audit logs retrieved for a workflow'
      );
      const filteredData = auditLogs.map((log) => {
        const filteredLog = {};
        Object.entries(log).forEach(([key, value]) => {
          if (key !== 'workflowId' && value !== null) {
            filteredLog[key] = value;
          }
        });
        return filteredLog;
      });

      const pageCount = Math.ceil(total / parsedLimit);
      const currentPageCount = filteredData.length;

      const response = {
        data: filteredData,
        pagination: {
          total,
          pageCount,
          currentPage: parsedPage,
          currentPageCount
        }
      };

      return res.sendResponse(response);
    } catch (error) {
      const { stack, message } = error;
      logger.error(
        { error, stack, message, workflowId, query: req?.query },
        'Error occurred while retrieving audit logs of a workflow'
      );
      return res.sendResponse("An error occurred while getting workflow's history.", 500);
    } finally {
      await mongoPrisma.$disconnect();
    }
  }
);

// Endpoint to retrieve a specific workflow history
router.get(
  '/:workflowId/history/:historyId',
  authorize([groups.ADMIN_GROUP_NAME, groups.WRITER_GROUP_NAME, groups.EDITOR_GROUP_NAME]),
  async (req, res) => {
    try {
      const { workflowId, historyId } = req.params;
      const { styleId } = req.query;
      logger.info({ params: req.params }, 'Fetching AuditLog');
      const auditLog = await mongoPrisma.workbenchAudit.findFirstOrThrow({
        where: {
          id: historyId,
          workflowId
        }
      });

      if (!auditLog) {
        logger.error({ params: req?.params }, 'AuditLog not found');
        return res.sendResponse('AuditLog not found.', 404);
      }

      let filteredLog = {};
      Object.entries(auditLog).forEach(([key, value]) => {
        if (key !== 'workflowId' && value !== null) {
          filteredLog[key] = value;
        }
      });

      if (styleId) {
        const results = await Promise.allSettled([
          AxiosInterceptor.get(`${ATTRIBUTE_API_DOMAIN_NAME}/attribute-api/styles/${styleId}`, {
            httpsAgent
          }),
          AxiosInterceptor.get(`${MERCH_API_DOMAIN_NAME}/merchv3/products/${styleId}`, {
            httpsAgent
          })
        ]);
        const [attributeApiResponse, merchApiResponse] = results.map((result) => result.value);
        const { defaultCatalog, brandName, inactive, ageCategory, genderCategory } =
          merchApiResponse?.data || {};
        const { productGroupName } = attributeApiResponse?.data || {};

        logger.info({ duration: merchApiResponse?.duration }, '[GET] Merch api response time');
        logger.info(
          { duration: attributeApiResponse?.duration },
          '[GET] Attribute api response time'
        );
        filteredLog = {
          ...filteredLog,
          productInfo: {
            productGroupName,
            defaultCatalog,
            brandName,
            inactive,
            ageCategory,
            genderCategory
          }
        };
      }

      return res.sendResponse(filteredLog);
    } catch (error) {
      const { stack, message } = error;
      logger.error(
        { error, stack, message, params: req.params, query: req.query },
        'Error occurred while retrieving specific audit log of a workflow'
      );
      if (error.code === 'P2025') {
        return res.sendResponse('The requested history does not exist', 400);
      }

      return res.sendResponse('An error occurred while getting workflow history.', 500);
    } finally {
      await mongoPrisma.$disconnect();
    }
  }
);

// Update workflows status and assign writer or editor
router.patch(
  '/assign',
  authorize([groups.ADMIN_GROUP_NAME]),
  validateMiddleware({ body: assignWorkflowDto }),
  async (req, res) => {
    try {
      const {
        filters: { excludeIds, ...filters },
        assignments: { writer, editor }
      } = req.body;

      const { email } = req.user;
      logger.info({ body: req.body, query: req.query }, 'Assigning workflow');
      let where = whereBuilder(filters);

      const data = await mongoPrisma.workflow.findMany({
        select: {
          status: true,
          assignee: true
        },
        where
      });

      const distinctStatuses = [...new Set(data.map(({ status }) => status))];
      const distinctAssignees = [...new Set(data.map(({ assignee }) => assignee))];

      if (distinctAssignees.includes(writer) || distinctAssignees.includes(editor)) {
        return res.sendResponse(
          {
            message: 'Same user cannot be reassigned.'
          },
          400
        );
      }

      let updateCount = 0;
      const errors = [];
      const auditLogs = [];

      for await (const status of distinctStatuses) {
        where = { ...where, status };
        const workflows = await mongoPrisma.workflow.findMany({ where, take: 1 });

        try {
          const changeLog = workflowEngine(workflows[0], { writer, editor });

          if (Object.keys(changeLog).length > 0) {
            const transformedData = transformObject(
              {
                ...changeLog,
                lastUpdatedBy: email
              },
              {
                writer: 'lowerCase',
                editor: 'lowerCase',
                assignee: 'lowerCase',
                lastUpdatedBy: 'lowerCase'
              }
            );

            const { count } = await mongoPrisma.workflow.updateMany({
              data: transformedData,
              where
            });

            updateCount += count;
          }

          const workflowAuditLogs = workflows.map((workflow) => ({
            workflowId: workflow.id,
            ...changeLog,
            auditType: WorkflowAuditType.ASSIGNMENTS,
            createdBy: email
          }));

          auditLogs.push(...workflowAuditLogs);
        } catch (error) {
          const { stack, message } = error;
          errors.push({
            filters: { ...filters, status },
            stack,
            message
          });
        }
      }

      if (updateCount > 0) {
        if (auditLogs.length > 0) {
          await mongoPrisma.workbenchAudit.createMany({
            data: auditLogs
          });
        }

        return res.sendResponse(
          {
            message: `${updateCount} workflow${updateCount !== 1 ? 's' : ''} updated successfully`,
            errors: errors.length ? errors : null
          },
          errors.length ? 207 : 200
        );
      }

      if (errors.length > 0) {
        logger.error(
          { errors, body: req.body, query: req.query },
          'Error occured while Assigning workflows'
        );
        return res.sendResponse(
          {
            message: 'Errors occurred while updating workflows',
            errors
          },
          400
        );
      }

      return res.sendResponse(
        {
          message: 'No workflows found for updating.'
        },
        404
      );
    } catch (error) {
      const { stack, message } = error;
      logger.error(
        { error, stack, message, body: req.body, query: req.query },
        'Error occured while Assigning workflows'
      );
      return res.sendResponse('An error occurred while updating the workflows.', 500);
    } finally {
      await mongoPrisma.$disconnect();
    }
  }
);

const convertToAttributesModel = (styleId, newProductAttributes, previousProductAttributes) => {
  const {
    genus,
    species,
    techSpecs,
    harmonizingAttributeLabels,
    staleTechSpecs,
    attributeLastModified
  } = newProductAttributes;

  const { productGroupId, productGroupName, ageCategory, genderCategory, tags, lastModified } =
    previousProductAttributes;

  const productAttributes = {
    style: styleId,
    genusId: genus && genus.id !== 0 ? Number(genus.id) : null,
    genusName: genus && genus.name ? genus.name : null,
    speciesId: species && species.id !== 0 ? Number(species.id) : null,
    speciesName: species && species.name ? species.name : null,
    productGroupId,
    productGroupName,
    ageCategory,
    genderCategory,
    lastModified: attributeLastModified ?? lastModified,
    tags: tags || null,
    harmonizingAttributeLabels:
      harmonizingAttributeLabels && harmonizingAttributeLabels.length
        ? harmonizingAttributeLabels
        : [],
    techSpecs: techSpecs ?? [],
    staleTechSpecs: staleTechSpecs ?? []
  };

  return productAttributes;
};

const convertToCopyModel = (styleId, currentCopy, previousCopy) => {
  const {
    version,
    listDescription,
    detailedDescription,
    bulletPoints,
    copyLastModified,
    sizingChart,
    competitiveCyclistDescription,
    competitiveCyclistBottomLine,
    bottomLine
  } = currentCopy;

  const { __v, brandId, productGroupId, writer, title, editor, keywords, lastModified } =
    previousCopy;

  const copyModel = {
    __v: version ?? __v,
    style: styleId,
    title,
    listDescription,
    detailDescription: detailedDescription,
    competitiveCyclistDescription,
    bottomLine,
    competitiveCyclistBottomLine,
    writer,
    editor,
    bulletPoints,
    brandId,
    keywords,
    sizingChartId: sizingChart?.id ?? null,
    productGroupId,
    lastModified: copyLastModified ?? lastModified
  };

  return copyModel;
};

const updateBC = async (styleId, currentSnapshot, copyStatus) => {
  let previousAttributes;
  let attributesResult;
  let copyResult;

  try {
    logger.info({ styleId, currentSnapshot }, 'Updating workflow details in backcountry apis');

    const getAttributesElseCreate = async () => {
      try {
        const attributes = await getStyleAttributes(styleId);
        return attributes;
      } catch (error) {
        const { stack, message, response } = error;
        if (response?.status === 404) {
          logger.error(
            { error, styleId },
            'Style not found while fetching style details from the attributes api, Hence creating a new attributes'
          );
          try {
            const {
              success,
              data,
              error: createError
            } = await upsertStyleAttributes(styleId, {
              style: styleId
            });

            if (success) {
              return data;
            }

            logger.error({ stack, message, error: createError, styleId }, createError);
            throw new Error(createError);
          } catch (createError) {
            logger.error({ stack, message, error: createError, styleId }, createError);
            throw new Error(createError);
          }
        } else {
          logger.error(
            { stack, message, error, styleId },
            'Error occurred while fetching style details from the attributes api'
          );
          throw new Error('Error occurred while fetching style details from the attributes api');
        }
      }
    };

    previousAttributes = await getAttributesElseCreate(styleId);

    const newAttributes = convertToAttributesModel(styleId, currentSnapshot, previousAttributes);
    attributesResult = await upsertStyleAttributes(styleId, newAttributes);

    if (!attributesResult.success) {
      return {
        attributesApi: attributesResult
      };
    }

    const previousCopy = await getStyleCopy(styleId);
    const newCopy = convertToCopyModel(styleId, currentSnapshot, previousCopy);
    newCopy.status = copyStatus;
    copyResult = await updateStyleCopy(newCopy);

    if (!copyResult.success) {
      throw new Error('Error occurred while saving copy to the DB.');
    }

    return {
      attributesApi: attributesResult,
      copyApi: copyResult
    };
  } catch (error) {
    if (attributesResult) {
      logger.info({ styleId }, 'Rolling back atttribute updates');
      previousAttributes.lastModified = attributesResult.data.lastModified;
      await upsertStyleAttributes(styleId, previousAttributes);
      logger.info({ styleId }, 'Atttribute updates rolled back');
    }
    throw new Error(`Failed while updating BC about the changes: ${error.message}`);
  }
};

// Endpoint to save a snapshot of a workflow for later audit log
router.patch(
  '/:workflowId',
  authorize([groups.ADMIN_GROUP_NAME, groups.WRITER_GROUP_NAME, groups.EDITOR_GROUP_NAME]),
  validateMiddleware({ body: workflowDetailsDto }),
  async (req, res) => {
    let styleId;
    try {
      const { workflowId } = req.params;
      const currentSnapshot = req.body;
      logger.info({ params: req.params, body: req.body }, '[save for later] Updating workflow');

      const workflow = await findWorkflowById(workflowId);

      styleId = workflow?.styleId;

      const { email } = req.user;

      const { isPublished, isQuickFix } = currentSnapshot;

      // By default, evaluate the workflow unless it follows the quick fix flow.
      let changeLog = !isQuickFix ? workflowEngine(workflow, { isPublished }) : {};

      const getCopyElseCreate = async () => {
        try {
          const copy = await getStyleCopy(styleId);
          return copy;
        } catch (error) {
          const { stack, message, response } = error;
          if (response?.status === 404) {
            logger.error(
              { error, stack, message, styleId },
              'Style not found while fetching style details from the COPY api, Hence creating a new copy'
            );
            try {
              const {
                success,
                data,
                error: createError
              } = await createStyleCopy({
                style: styleId,
                status: 'InProgress'
              });

              if (success) {
                return data;
              }

              logger.error({ stack, message, error: createError, styleId }, createError);
              throw createError;
            } catch (createError) {
              logger.error({ stack, message, error: createError, styleId }, createError);
              throw createError;
            }
          } else {
            logger.error(
              { stack, message, error, styleId },
              'Error occurred while fetching style details from the COPY api'
            );
            throw error;
          }
        }
      };

      const { status } = await getCopyElseCreate();

      const getCopyStatus = () => {
        if (isQuickFix === true) {
          return status;
        }
        if (isPublished === true) {
          return CopyStatus.PUBLISHED;
        }
        return status;
      };

      const copyStatus = getCopyStatus();

      if (isQuickFix === true) {
        changeLog = { isPublished: copyStatus === CopyStatus.PUBLISHED };
      }

      if (Object.keys(currentSnapshot).length === 0 && Object.keys(changeLog).length === 0) {
        return res.sendResponse('No changes detected. Nothing to save.', 400);
      }

      const { attributesApi, copyApi } = await updateBC(styleId, currentSnapshot, copyStatus);

      const failedToUpdateBC =
        !attributesApi || !copyApi || !attributesApi.success || !copyApi.success;

      if (failedToUpdateBC) {
        logger.error(
          { params: req.params, body: req.body, attributesApi, copyApi },
          'Error occurred while saving workflow details to BC'
        );
        return res.sendResponse(
          {
            message: 'An error occurred while saving workflow deatils to BC.',
            attributesApi,
            copyApi
          },
          400
        );
      }

      if (Object.keys(changeLog).length) {
        changeLog = transformObject(
          {
            ...changeLog,
            lastUpdatedBy: email
          },
          {
            writer: 'lowerCase',
            editor: 'lowerCase',
            assignee: 'lowerCase',
            lastUpdatedBy: 'lowerCase'
          }
        );

        logger.info({ data: changeLog, id: workflow.id }, 'Updating workflow');

        try {
          await mongoPrisma.workflow.update({
            data: changeLog,
            where: {
              id: workflow.id
            }
          });

          logger.info({ data: changeLog, id: workflow.id }, 'Workflow updated successfully!');
        } catch (error) {
          const { stack, message } = error;
          logger.error(
            { stack, message, error, data: changeLog, id: workflow.id },
            'An error occurred while updating the workflow:'
          );

          throw new Error('An error occurred while updating the workflow:');
        }
      }

      let hasDiff = false;

      if (Object.keys(currentSnapshot).length) {
        const previousSnapshot = await mongoPrisma.workbenchAudit.findFirst({
          where: {
            workflowId,
            auditType: WorkflowAuditType.DATA_NORMALIZATION
          },
          orderBy: {
            createTs: 'desc'
          }
        });

        const diff = deepCompare(previousSnapshot, currentSnapshot, [
          'changeLog',
          'id',
          'createTs',
          'createdBy',
          'workflowId',
          'auditType',
          'attributeLastModified',
          'copyLastModified',
          'isQuickFix'
        ]);

        hasDiff = Object.keys(diff).length > 0;

        changeLog = {
          ...changeLog,
          ...diff,
          isQuickFix: isQuickFix === true ? isQuickFix : undefined
        };
      }

      if (Object.keys(changeLog).length === 0 || !hasDiff) {
        logger.info({ changeLog, hasDiff }, 'No changes detected. Nothing to save');
        return res.sendResponse('No changes detected. Nothing to save.', 400);
      }

      const {
        copyLastModified,
        attributeLastModified,
        isQuickFix: _,
        ...restOfCurrentSnapshot
      } = currentSnapshot;

      logger.info(
        {
          data: {
            workflowId,
            createdBy: email,
            ...restOfCurrentSnapshot,
            auditType: WorkflowAuditType.DATA_NORMALIZATION,
            changeLog
          }
        },
        'Creating audit log for the workflow update'
      );

      await mongoPrisma.workbenchAudit.create({
        data: {
          workflowId,
          createdBy: email,
          ...restOfCurrentSnapshot,
          auditType: WorkflowAuditType.DATA_NORMALIZATION,
          changeLog
        }
      });

      return res.sendResponse({
        workflowId,
        createdBy: email,
        ...currentSnapshot,
        changeLog
      });
    } catch (error) {
      const { stack, message } = error;
      logger.error(
        { error, stack, message, params: req.params, body: req.body },
        'An error occurred while saving workflow for later'
      );

      return res.sendResponse(
        `An error occurred while saving workflow for ${styleId}`,
        error.status || 500
      );
    } finally {
      await mongoPrisma.$disconnect();
    }
  }
);

// Endpoint to delete a workflow after unit tests
if (process.env.NODE_ENV === 'local') {
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;

      await mongoPrisma.workflow.delete({
        where: {
          styleId: id
        }
      });

      return res.sendResponse(
        {
          message: 'Workflow deleted successfully.'
        },
        200
      );
    } catch (error) {
      console.error(error);
      return res.sendResponse('An error occurred while deleting the workflow.', 500);
    } finally {
      await mongoPrisma.$disconnect();
    }
  });
}

module.exports = router;
