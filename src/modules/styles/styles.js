const express = require('express');
const axios = require('axios');
const https = require('https');

const { authorize } = require('../../middlewares');
const { groups } = require('../../properties');
const { logger } = require('../../lib/logger');

const { ATTRIBUTE_API_DOMAIN_NAME, COPY_API_DOMAIN_NAME, MERCH_API_DOMAIN_NAME } = process.env;
const router = express.Router();

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const getStyle = async (styleId) => {
  try {
    const response = await axios.get(`${MERCH_API_DOMAIN_NAME}/merchv3/products/${styleId}`, {
      httpsAgent
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      const notFoundError = new Error('Style not found.');
      notFoundError.status = 404;
      throw notFoundError;
    } else {
      throw new Error('An error occurred while fetching the style information.', 500);
    }
  }
};

const getStyleAttributes = async (styleId) => {
  const response = await axios.get(`${ATTRIBUTE_API_DOMAIN_NAME}/attribute-api/styles/${styleId}`, {
    httpsAgent
  });
  return response.data;
};

const upsertStyleAttributes = async (styleId, payload) => {
  try {
    const response = await axios.put(
      `${ATTRIBUTE_API_DOMAIN_NAME}/attribute-api/styles/${styleId}`,
      payload,
      { httpsAgent }
    );

    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage =
      error.response?.data || 'An error occurred while updating product attributes';
    return { success: false, error: errorMessage };
  }
};

const getStyleCopy = async (styleId) => {
  const response = await axios.get(`${COPY_API_DOMAIN_NAME}/copy-api/copy/${styleId}`, {
    httpsAgent
  });
  return response.data;
};

const createStyleCopy = async (payload) => {
  try {
    const response = await axios.post(`${COPY_API_DOMAIN_NAME}/copy-api/copy`, payload, {
      httpsAgent
    });

    logger.info(
      { data: response?.data, payload },
      'Style copy created successfully in the COPY API'
    );
    return { success: true, data: response.data };
  } catch (error) {
    const { stack, message } = error;
    logger.error(
      { stack, message, error, payload },
      'An error occurred while creating style copy in the COPY API'
    );
    const errorMessage = error.response?.data || 'Failed to create style copy';
    return { success: false, error: errorMessage };
  }
};

const updateStyleCopy = async (payload) => {
  const { style: styleId } = payload;

  try {
    const response = await axios.put(`${COPY_API_DOMAIN_NAME}/copy-api/copy/${styleId}`, payload, {
      httpsAgent
    });

    return { success: true, data: response.data };
  } catch (error) {
    const { stack, message } = error;
    logger.error(
      { stack, message, error, payload },
      'Error occured while updating style details in the copy api'
    );
    const errorMessage = error.response?.data || 'An error occurred while updating copy';
    return { success: false, error: errorMessage };
  }
};

router.get(
  '/:styleId/attributes',
  authorize([groups.ADMIN_GROUP_NAME, groups.WRITER_GROUP_NAME, groups.EDITOR_GROUP_NAME]),
  async (req, res) => {
    try {
      const { styleId } = req.params;
      logger.info({ styleId }, 'Fetching style details from the Attribute api');
      const response = await getStyleAttributes(styleId);
      logger.info({ response, styleId }, 'Received response from the Attribute api');
      return res.sendResponse(response);
    } catch (error) {
      const { stack, message } = error;
      logger.error(
        { error, stack, message, styleId: req?.params?.styleId },
        'Error occured while Fetching style details from the Attribute api'
      );
      return res.sendResponse('Internal Server Error', 500);
    }
  }
);

router.put(
  '/:styleId/attributes',
  authorize([groups.ADMIN_GROUP_NAME, groups.WRITER_GROUP_NAME, groups.EDITOR_GROUP_NAME]),
  async (req, res) => {
    try {
      const { styleId } = req.params;
      const payload = req.body;
      logger.info({ styleId, payload }, 'Updating style details in the Attribute api');
      const { success, data, error } = await upsertStyleAttributes(styleId, payload);
      logger.info(
        { success, data, error, styleId, payload },
        'Updated style details from the Attribute api'
      );
      if (success) {
        return res.sendResponse(data);
      }
      const { stack, message } = error;
      logger.error(
        { success, data, stack, message, error, styleId, payload },
        'Something went wrong while updating style details in the Attribute api'
      );
      return res.sendResponse(error, error.status || 500);
    } catch (error) {
      const { stack, message } = error;
      logger.error(
        { error, stack, message, styleId: req?.params?.styleId, payload: req?.body },
        'Error occured while updating style details in the Attribute api'
      );
      return res.sendResponse('Internal Server Error', 500);
    }
  }
);

router.get(
  '/:styleId/copy',
  authorize([groups.ADMIN_GROUP_NAME, groups.WRITER_GROUP_NAME, groups.EDITOR_GROUP_NAME]),
  async (req, res) => {
    try {
      const { styleId } = req.params;
      logger.info({ styleId }, 'Fetching style details from the COPY api');
      const response = await getStyleCopy(styleId);
      logger.info({ response, styleId }, 'Received response from the COPY api');
      return res.sendResponse(response);
    } catch (error) {
      const { stack, message } = error;
      logger.error(
        { error, stack, message, styleId: req?.params?.styleId },
        'Error occured while Fetching style details from the COPY api'
      );
      return res.sendResponse('Internal Server Error', 500);
    }
  }
);

router.post(
  '/:styleId/copy',
  authorize([groups.ADMIN_GROUP_NAME, groups.WRITER_GROUP_NAME, groups.EDITOR_GROUP_NAME]),
  async (req, res) => {
    try {
      const { styleId } = req.params;
      const payload = req.body;
      logger.info({ styleId, payload }, 'Creating style copy in the COPY API');
      const result = await createStyleCopy(payload);

      if (result.success) {
        logger.info(
          { styleId, payload, result },
          'Style copy created successfully in the COPY API'
        );
        return res.sendResponse(result.data);
      }
      const { stack, message } = result.error;
      logger.error(
        { styleId, stack, message, payload, error: result.error },
        'Failed to create style copy in the COPY API'
      );
      return res.sendResponse(result.error, 500);
    } catch (error) {
      const { stack, message } = error;
      logger.error(
        { error, stack, message, styleId: req?.params?.styleId, payload: req.body },
        'Error occurred while creating style copy in the COPY API'
      );
      return res.sendResponse('Internal Server Error', 500);
    }
  }
);

router.put(
  '/:styleId/copy',
  authorize([groups.ADMIN_GROUP_NAME, groups.WRITER_GROUP_NAME, groups.EDITOR_GROUP_NAME]),
  async (req, res) => {
    try {
      const { styleId } = req.params;
      const payload = req.body;
      logger.info({ styleId, payload }, 'Updating style details in the COPY api');
      const { success, data, error } = await updateStyleCopy(styleId, payload);
      logger.info(
        { success, data, error, styleId, payload },
        'Updated style details from the COPY api'
      );
      if (success) {
        return res.sendResponse(data);
      }
      const { stack, message } = error;
      logger.error(
        { success, stack, message, data, error, styleId, payload },
        'Something went wrong while updating style details in the COPY api'
      );
      return res.sendResponse(error, error.status || 500);
    } catch (error) {
      const { stack, message } = error;
      logger.error(
        { error, stack, message, styleId: req?.params?.styleId, payload: req?.body },
        'Error occured while updating style details in the COPY api'
      );
      return res.sendResponse('Internal Server Error', 500);
    }
  }
);

module.exports = {
  router,
  getStyle,
  createStyleCopy,
  getStyleAttributes,
  upsertStyleAttributes,
  getStyleCopy,
  updateStyleCopy
};
