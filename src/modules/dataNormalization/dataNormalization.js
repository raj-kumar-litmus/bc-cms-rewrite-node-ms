const express = require('express');
const axios = require('axios');
const https = require('https');

const { postgresPrisma, mongoPrisma } = require('../prisma');
const { groupBy } = require('../../utils');
const { validateMiddleware } = require('../../middlewares');
const { getStylesDto } = require('./dtos');

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
  try {
    const response = await axios.get(
      `${ATTRIBUTE_API_DOMAIN_NAME}/attribute-api/styles/${styleId}`,
      {
        httpsAgent
      }
    );
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

const getStyleCopy = async (styleId) => {
  try {
    const response = await axios.get(`${COPY_API_DOMAIN_NAME}/copy-api/copy/${styleId}`, {
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

const updateStyleAttributes = async (styleId, payload) => {
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

const updateStyleCopy = async (payload) => {
  const { style: styleId } = payload;

  try {
    const response = await axios.put(`${COPY_API_DOMAIN_NAME}/copy-api/copy/${styleId}`, payload, {
      httpsAgent
    });

    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = error.response?.data || 'An error occurred while updating copy';
    return { success: false, error: errorMessage };
  }
};

// TODO: Move this to styles route
router.get('/styles/:styleId/attributes', async (req, res) => {
  try {
    const { styleId } = req.params;
    const response = await getStyleAttributes(styleId);
    return res.sendResponse(response);
  } catch (error) {
    console.error(error.message);
    return res.sendResponse('Internal Server Error', 500);
  }
});

// TODO: Move this to styles route
router.put('/styles/:styleId/attributes', async (req, res) => {
  try {
    const { styleId } = req.params;
    const payload = req.body;

    const { success, data, error } = await updateStyleAttributes(styleId, payload);

    if (success) {
      return res.sendResponse(data);
    }
    return res.sendResponse(error, error.status || 500);
  } catch (error) {
    console.error(error.message);
    return res.sendResponse('Internal Server Error', 500);
  }
});

// TODO: Move this to styles route
router.get('/styles/:styleId/copy', async (req, res) => {
  try {
    const { styleId } = req.params;
    const response = await getStyleCopy(styleId);
    return res.sendResponse(response);
  } catch (error) {
    console.error(error.message);
    return res.sendResponse('Internal Server Error', 500);
  }
});

// TODO: Move this to styles route
router.put('/styles/:styleId/copy', async (req, res) => {
  try {
    const { styleId } = req.params;
    const payload = req.body;

    const { success, data, error } = await updateStyleCopy(styleId, payload);

    if (success) {
      return res.sendResponse(data);
    }
    return res.sendResponse(error, error.status || 500);
  } catch (error) {
    console.error(error.message);
    return res.sendResponse('Internal Server Error', 500);
  }
});

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
    console.error(error);
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
    console.log(error);
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

    const { data } = await axios.get(
      `${ATTRIBUTE_API_DOMAIN_NAME}/attribute-api/styles/${styleId}`,
      {
        httpsAgent
      }
    );

    const labels = data.harmonizingAttributeLabels
      .map((e) => e.harmonizingAttributeValues.map((l) => l.id))
      .flat(Infinity);

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
        ...(labels.includes(e.hattributevid) && { selected: true })
      }));
    });

    const updatedTechSpecLabels = techSpecLabels
      .filter((e) => {
        return !data.techSpecs.map(({ label }) => label)?.includes(e.label);
      })
      .map(({ id, label, labelid, order }) => ({
        id,
        label,
        labelId: labelid,
        order
      }));

    return res.sendResponse({
      hattributes,
      techSpecs: [...data.techSpecs, ...updatedTechSpecLabels]
    });
  } catch (error) {
    console.error(error.message);
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

    const { data } = await axios.get(
      `${ATTRIBUTE_API_DOMAIN_NAME}/attribute-api/styles/${styleId}`,
      {
        httpsAgent
      }
    );

    const labels = data.harmonizingAttributeLabels
      .map((e) => e.harmonizingAttributeValues.map((l) => l.id))
      .flat(Infinity);
    const hattributes = {};
    Object.keys(groupedHAttributes).forEach((el) => {
      hattributes[el] = groupedHAttributes[el].map((e) => ({
        ...e,
        ...(labels.includes(e.hattributevid) && { selected: true })
      }));
    });

    const updatedTechSpecLabels = techSpecLabels
      .filter((e) => {
        return !data.techSpecs.map(({ label }) => label)?.includes(e.label);
      })
      .map(({ id, label, labelid, order }) => ({
        id,
        label,
        labelId: labelid,
        order
      }));

    return res.sendResponse({
      hattributes,
      techSpecs: [...data.techSpecs, ...updatedTechSpecLabels]
    });
  } catch (error) {
    console.error(error.message);
    return res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/merchProduct/:styleId', async (req, res) => {
  try {
    const { styleId } = req.params;
    const { data } = await axios.get(`${MERCH_API_DOMAIN_NAME}/merchv3/products/${styleId}`, {
      httpsAgent
    });
    return res.sendResponse({ data });
  } catch (error) {
    console.error(error.message);
    return res.sendResponse('Internal Server Error', 500);
  }
});

router.post('/styleSearch', validateMiddleware({ body: getStylesDto }), async (req, res) => {
  try {
    const {
      body: { styles }
    } = req;
    const success = [];
    const failures = [];
    const workflowExists = [];

    await Promise.all(
      styles.map(async (styleId) => {
        const count = await mongoPrisma.workflow.count({ where: { styleId } });
        if (!count) {
          try {
            const { data } = await axios.get(
              `${MERCH_API_DOMAIN_NAME}/merchv3/products/${styleId}`,
              {
                httpsAgent
              }
            );
            const { style, title, brandName, lastModified, lastModifiedUsername } = data;
            success.push({ style, title, brandName, lastModified, lastModifiedUsername });
          } catch (err) {
            failures.push(styleId);
          }
        } else {
          workflowExists.push(styleId);
        }
      })
    );

    return res.sendResponse({ success, failures, workflowExists });
  } catch (error) {
    console.error(error.message);
    return res.sendResponse('Error occured while searching for styles', 500);
  }
});

router.get('/productInfo/:styleId', async (req, res) => {
  try {
    const { styleId } = req.params;
    const results = await Promise.allSettled([
      axios.get(`${COPY_API_DOMAIN_NAME}/copy-api/published-copy/${styleId}`, {
        httpsAgent
      }),
      axios.get(`${ATTRIBUTE_API_DOMAIN_NAME}/attribute-api/styles/${styleId}`, {
        httpsAgent
      }),
      axios.get(`${MERCH_API_DOMAIN_NAME}/merchv3/products/${styleId}`, {
        httpsAgent
      }),
      axios.get(`${MERCH_API_DOMAIN_NAME}/merchv3/size-charts?shouldSkipChart=true`, {
        httpsAgent
      })
    ]);
    const [copyApiResponse, attributeApiResponse, merchApiResponse, sizingChart] = results.map(
      (result) => result.value
    );
    return res.sendResponse({
      copyApiResponse: copyApiResponse?.data,
      merchApiResponse: merchApiResponse?.data,
      attributeApiResponse: attributeApiResponse?.data,
      sizingChart: sizingChart?.data
    });
  } catch (err) {
    console.error(err.message);
    return res.sendResponse('Internal Server Error', 500);
  }
});

module.exports = {
  router,
  getStyle,
  getStyleAttributes,
  updateStyleAttributes,
  getStyleCopy,
  updateStyleCopy
};
