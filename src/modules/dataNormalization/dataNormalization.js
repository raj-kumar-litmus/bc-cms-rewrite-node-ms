const express = require('express');
const https = require('https');

const { postgresPrisma, mongoPrisma } = require('../prisma');
const { groupBy, chunkArray, constants } = require('../../utils');
const { validateMiddleware } = require('../../middlewares');
const { getStylesDto } = require('./dtos');
const { logger } = require('../../lib/logger');
const { AxiosInterceptor } = require('../../lib/axios');

const { ATTRIBUTE_API_DOMAIN_NAME, COPY_API_DOMAIN_NAME, MERCH_API_DOMAIN_NAME } = process.env;
const router = express.Router();

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

router.get('/genus', async (req, res) => {
  try {
    const { page, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit, 10);
    if (!page) {
      const genus = await postgresPrisma.dn_genus.findMany({});
      const total = genus.length;
      const pageCount = Math.ceil(total / parsedLimit);
      return res.sendResponse({
        genus,
        pagination: {
          total,
          pageCount,
          currentPage: 1,
          currentPageCount: genus.length
        }
      });
    }
    const parsedPage = parseInt(page, 10);
    if (Number.isNaN(parsedLimit) || Number.isNaN(parsedPage)) {
      return res.sendResponse(
        'Invalid page or limit value. Please provide valid numeric values for page and limit parameters.',
        400
      );
    }
    const skip = (parsedPage - 1) * parsedLimit;
    const [genus, total] = await Promise.all([
      postgresPrisma.dn_genus.findMany({
        skip,
        take: parsedLimit
      }),
      postgresPrisma.dn_genus.count()
    ]);
    const pageCount = Math.ceil(total / parsedLimit);
    return res.sendResponse({
      genus,
      pagination: {
        total,
        pageCount,
        currentPage: parsedPage,
        currentPageCount: genus.length
      }
    });
  } catch (error) {
    const { stack, message } = error;
    logger.error({ stack, message, error }, 'Error occured while fetching genus');
    return res.sendResponse(
      'An error occurred while retrieving the genus data. Please try again later.',
      500
    );
  }
});

router.get('/genus/:genusId/species', async (req, res) => {
  try {
    const { genusId } = req.params;

    const result = await postgresPrisma.$queryRaw`
      select
        g.id,
        g.dattributelid,
        gelat.dattributevid,
        dav.text,
        attr.name
      from
        DN_Genus g
      inner join DN_DAttributeV dav on
        dav.dAttributeLId = g.dAttributeLId
      inner join DN_Genus_AttributeL_AttributeType gelat on
        gelat.genusid = g.id
      inner join dn_dattributel attr on
        attr.id = g.dattributelid
      where
        g.id = ${parseInt(genusId)}
        and gelat.dattributevid = dav.id
      group by
        g.id,
        g.dattributelid,
        gelat.dattributevid,
        dav.text,
        attr.name`;

    return res.sendResponse({
      result
    });
  } catch (error) {
    const { stack, message } = error;
    logger.error(
      { stack, message, error, genusId: req?.params?.genusId },
      'Error occured while fetching species'
    );
    return res.sendResponse('Error while fetching species details', 500);
  }
});

router.get('/genus/:genusId/hAttributes/:styleId', async (req, res) => {
  try {
    const { genusId, styleId } = req.params;

    const labelFilter = await postgresPrisma.$queryRaw`
      SELECT s.hattributevid , hattr.text, hattr.hattributelid, label.name FROM dn_genus_hattributev s
      inner join dn_hattributev hattr on
      hattr.id = s.hattributevid
      inner join dn_hattributel label on
      label.id = hattr.hattributelid
      inner join dn_genus_hattributev dgh on
      dgh.genusid = s.genusid
      where s.genusid = ${parseInt(genusId)}
      group by s.hattributevid, hattr.text, hattr.hattributelid, label.name`;

    const groupedHAttributes = groupBy(labelFilter, (e) => e.name);

    logger.info(
      {
        genusId,
        styleId,
        ATTRIBUTE_API_DOMAIN_NAME
      },
      'Fetching hAttributes from attribute api'
    );

    let data;
    let labels;

    try {
      const response = await AxiosInterceptor.get(
        `${ATTRIBUTE_API_DOMAIN_NAME}/attribute-api/styles/${styleId}`,
        {
          httpsAgent
        }
      );
      data = response?.data;
      const duration = response?.duration;
      logger.info({ duration }, '[GET] Attribute api response time');
    } catch (error) {
      const { stack, message } = error;
      logger.error(
        {
          error,
          stack,
          message,
          genusId: req?.params?.genusId,
          speciesId: req?.params?.speciesId,
          styleId: req?.params?.styleId,
          ATTRIBUTE_API_DOMAIN_NAME
        },
        'Error occured while fetching attributes'
      );
    }

    if (data) {
      labels = data.harmonizingAttributeLabels
        .map((e) => e.harmonizingAttributeValues.map((l) => l.id))
        .flat(Infinity);
    }

    const techSpecLabels = await postgresPrisma.$queryRaw`
      SELECT da.id, da.name as label, MAX(dao.id) as labelId, MIN(dao.position)as order from dn_attributeorder dao 
        inner join DN_Genus_AttributeL_AttributeType gal on dao.galatid = gal.id
        inner join dn_attributel da on da.id=gal.attributelid
        where gal.genusid =${parseInt(genusId)}
        GROUP BY da.id`;

    const hattributes = {};
    Object.keys(groupedHAttributes).forEach((el) => {
      hattributes[el] = groupedHAttributes[el].map((e) => ({
        ...e,
        ...(labels && labels.includes(e.hattributevid) && { selected: true })
      }));
    });
    /* eslint-disable-next-line */
    const updatedTechSpecLabels = techSpecLabels.map(({ id, label, labelid, order }) => ({
      id,
      label,
      labelId: id,
      value: data?.techSpecs?.find((e) => e.label === label)?.value,
      order
    }));

    logger.info(
      {
        data,
        hattributes,
        updatedTechSpecLabels,
        genusId,
        styleId,
        ATTRIBUTE_API_DOMAIN_NAME
      },
      'Response from hAttribute endpoint'
    );

    return res.sendResponse({
      hattributes,
      techSpecs: [...updatedTechSpecLabels]
    });
  } catch (error) {
    const { stack, message } = error;
    logger.error(
      {
        error,
        stack,
        message,
        genusId: req?.params?.genusId,
        styleId: req?.params?.styleId,
        ATTRIBUTE_API_DOMAIN_NAME
      },
      'Error occured while fetching hAttributes'
    );
    return res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/genus/:genusId/species/:speciesId/hAttributes/:styleId', async (req, res) => {
  try {
    const { genusId, speciesId, styleId } = req.params;

    const genusSpeciesFilter = await postgresPrisma.$queryRaw`
      SELECT s.hattributev_id, hattr.text, hattr.hattributelid, label.name FROM dn_genus_species_hattributev s
        inner join dn_hattributev hattr on
        hattr.id = s.hattributev_id
        inner join dn_hattributel label on
        label.id = hattr.hattributelid
        inner join dn_genus_hattributev dgh on
        dgh.genusid = s.genus_id
        where s.genus_id =  ${parseInt(genusId)} and s.species_id =  ${parseInt(speciesId)}
        group by s.hattributev_id, hattr.text, hattr.hattributelid, label.name`;

    const genusFilter = await postgresPrisma.$queryRaw`
      SELECT dgh.hattributevid, hattr.text,  hattr.hattributelid, label.name from dn_genus_hattributev dgh
        inner join dn_hattributev hattr on
        hattr.id = dgh.hattributevid
        inner join dn_hattributel label on
        label.id = hattr.hattributelid
        where dgh.genusid  = ${parseInt(genusId)}`;

    const groupedHAttributes = groupBy(
      [].concat(genusFilter).concat(
        genusSpeciesFilter.map((e) => ({
          ...e,
          hattributevid: e.hattributev_id
        }))
      ),
      (e) => e.name
    );

    const techSpecLabels = await postgresPrisma.$queryRaw`
      SELECT da.id, da.name as label, MAX(dao.id) as labelId, MIN(dao.position)as order from dn_attributeorder dao
        inner join DN_Genus_AttributeL_AttributeType gal on dao.galatid = gal.id
        inner join dn_attributel da on da.id=gal.attributelid
        where gal.genusid =${parseInt(genusId)} and dao.dattributevid =${parseInt(speciesId)}
        GROUP BY da.id`;

    logger.info(
      {
        genusId,
        speciesId,
        styleId,
        ATTRIBUTE_API_DOMAIN_NAME
      },
      'Fetching hAttributes from attribute api'
    );

    let data;
    let labels;

    try {
      const response = await AxiosInterceptor.get(
        `${ATTRIBUTE_API_DOMAIN_NAME}/attribute-api/styles/${styleId}`,
        {
          httpsAgent
        }
      );
      data = response?.data;
      const duration = response?.duration;
      logger.info({ duration }, '[GET] Attribute api response time');
    } catch (error) {
      const { stack, message } = error;
      logger.error(
        {
          error,
          stack,
          message,
          genusId: req?.params?.genusId,
          speciesId: req?.params?.speciesId,
          styleId: req?.params?.styleId,
          ATTRIBUTE_API_DOMAIN_NAME
        },
        'Error occured while fetching attributes'
      );
    }

    if (data) {
      labels = data.harmonizingAttributeLabels
        .map((e) => e.harmonizingAttributeValues.map((l) => l.id))
        .flat(Infinity);
    }

    const hattributes = {};
    Object.keys(groupedHAttributes).forEach((el) => {
      hattributes[el] = groupedHAttributes[el].map((e) => ({
        ...e,
        ...(labels && labels.includes(e.hattributevid) && { selected: true })
      }));
    });
    /* eslint-disable-next-line */
    const updatedTechSpecLabels = techSpecLabels.map(({ id, label, labelid, order }) => ({
      id,
      label,
      labelId: id,
      value: data?.techSpecs?.find((e) => e.label === label)?.value,
      order
    }));

    logger.info(
      {
        data,
        hattributes,
        updatedTechSpecLabels,
        genusId,
        speciesId,
        styleId,
        ATTRIBUTE_API_DOMAIN_NAME
      },
      'Response from hAttribute endpoint'
    );

    return res.sendResponse({
      hattributes,
      techSpecs: [...updatedTechSpecLabels]
    });
  } catch (error) {
    const { stack, message } = error;
    logger.error(
      {
        error,
        stack,
        message,
        genusId: req?.params?.genusId,
        speciesId: req?.params?.speciesId,
        styleId: req?.params?.styleId,
        ATTRIBUTE_API_DOMAIN_NAME
      },
      'Error occured while fetching hAttributes'
    );
    return res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/merchProduct/:styleId', async (req, res) => {
  try {
    const { styleId } = req.params;
    logger.info({ styleId, MERCH_API_DOMAIN_NAME }, 'Fetching Merch api');
    const { data, duration } = await AxiosInterceptor.get(
      `${MERCH_API_DOMAIN_NAME}/merchv3/products/${styleId}`,
      { httpsAgent }
    );
    logger.info({ duration }, '[GET] Merch api response time');
    logger.info({ styleId, MERCH_API_DOMAIN_NAME }, 'Response from Merch api');
    return res.sendResponse({ data });
  } catch (error) {
    const { stack, message } = error;
    logger.error(
      {
        error,
        stack,
        message,
        styleId: req.params.styleId,
        MERCH_API_DOMAIN_NAME
      },
      'Error occured while fetching style details from merch api'
    );
    return res.sendResponse('Internal Server Error', 500);
  }
});

router.post('/styleSearch', validateMiddleware({ body: getStylesDto }), async (req, res) => {
  try {
    const {
      body: { styles }
    } = req;
    let success = [];
    let failures = [];
    const workflowExists = [];

    const chunkedStyleIds = chunkArray(styles, constants.CHUNK_SIZE_STYLE_SEARCH);
    await Promise.all(
      chunkedStyleIds.map(async (styleId) => {
        const count = await mongoPrisma.workflow.count({ where: { styleId } });
        if (!count) {
          try {
            logger.info({ styleId, MERCH_API_DOMAIN_NAME }, '[Style search] Fetching Merch api');
            const { data, duration } = await AxiosInterceptor.get(
              `${MERCH_API_DOMAIN_NAME}/merchv3/products?styles=${styleId.join(',')}&variant=false`,
              {
                httpsAgent
              }
            );
            // const { style, title, brandName, lastModified, lastModifiedUsername } = data;
            logger.info({ duration }, '[GET] Merch api response time');
            logger.info({ data, styleId, MERCH_API_DOMAIN_NAME }, 'Response from Merch api');
            // success.push({ style, title, brandName, lastModified, lastModifiedUsername });
            success = success.concat(
              data.map(({ style, title, brandName, lastModified, lastModifiedUsername }) => ({
                style,
                title,
                brandName,
                lastModified,
                lastModifiedUsername
              }))
            );
          } catch (err) {
            const { stack, message } = err;
            logger.error(
              { err, stack, message, styleId, MERCH_API_DOMAIN_NAME },
              'Could not find styleId in Merch api'
            );
            failures = failures.concat(styleId); // todo.check this.
            // failures.push(styleId);
          }
        } else {
          logger.info(
            { styleId, MERCH_API_DOMAIN_NAME },
            'Workflow already exists for this styleId'
          );
          workflowExists.push(styleId);
        }
      })
    );
    logger.info(
      {
        success,
        failures,
        workflowExists,
        body: req.body
      },
      'Response from styleSearch api'
    );
    return res.sendResponse({
      success,
      failures,
      workflowExists,
      missing: req.body?.styles?.filter((e) => !success?.map((m) => m?.style)?.includes(e))
    });
  } catch (error) {
    const { stack, message } = error;
    logger.error(
      {
        error,
        stack,
        message,
        styleId: req.params.styleId,
        MERCH_API_DOMAIN_NAME
      },
      'Error occured while searching for styles'
    );
    return res.sendResponse('Error occured while searching for styles', 500);
  }
});

router.get('/productInfo/:styleId', async (req, res) => {
  try {
    const { styleId } = req.params;
    logger.info(
      { styleId, COPY_API_DOMAIN_NAME, ATTRIBUTE_API_DOMAIN_NAME, MERCH_API_DOMAIN_NAME },
      'Fetching product Info'
    );
    const results = await Promise.allSettled([
      AxiosInterceptor.get(`${COPY_API_DOMAIN_NAME}/copy-api/copy/${styleId}`, {
        httpsAgent
      }),
      AxiosInterceptor.get(`${ATTRIBUTE_API_DOMAIN_NAME}/attribute-api/styles/${styleId}`, {
        httpsAgent
      }),
      AxiosInterceptor.get(`${MERCH_API_DOMAIN_NAME}/merchv3/products/${styleId}`, {
        httpsAgent
      }),
      AxiosInterceptor.get(`${MERCH_API_DOMAIN_NAME}/merchv3/size-charts?shouldSkipChart=true`, {
        httpsAgent
      })
    ]);
    const [copyApiResponse, attributeApiResponse, merchApiResponse, sizingChart] = results.map(
      (result) => result.value
    );
    logger.info({ duration: merchApiResponse?.duration }, '[GET] Merch api response time');
    logger.info({ duration: copyApiResponse?.duration }, '[GET] Copy api response time');
    logger.info({ duration: attributeApiResponse?.duration }, '[GET] Attribute api response time');
    logger.info({ duration: sizingChart?.duration }, '[GET] Sizing chart api response time');
    logger.info(
      {
        styleId,
        copyApiResponse,
        attributeApiResponse,
        merchApiResponse,
        sizingChart
      },
      'Retrieved product Info from Backcountry apis'
    );
    return res.sendResponse({
      copyApiResponse: copyApiResponse?.data,
      merchApiResponse: merchApiResponse?.data,
      attributeApiResponse: attributeApiResponse?.data,
      sizingChart: sizingChart?.data
    });
  } catch (error) {
    const { stack, message } = error;
    logger.error(
      {
        error,
        stack,
        message,
        styleId: req.params.styleId,
        COPY_API_DOMAIN_NAME,
        ATTRIBUTE_API_DOMAIN_NAME,
        MERCH_API_DOMAIN_NAME
      },
      'Error occured while trying to fetch product info details'
    );
    return res.sendResponse('Internal Server Error', 500);
  }
});

module.exports = router;
