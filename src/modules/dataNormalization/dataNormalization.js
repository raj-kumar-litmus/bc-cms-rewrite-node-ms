const express = require('express');
const axios = require('axios');

const { postgresPrisma } = require('../prisma');
const { groupBy } = require('../../utils');
const { validateMiddleware } = require('../../middlewares');
const { getProductsDto } = require('./dtos');

const { ATTRIBUTE_API_DOMAIN_NAME, COPY_API_DOMAIN_NAME, MERCH_API_DOMAIN_NAME } = process.env;
const router = express.Router();

const getConfig = (req) => {
  const { cookie: Cookie } = req.headers; // Retrieve the Cookie header value

  return {
    headers: {
      Cookie
    },
    followRedirects: true
  };
};

const getStyle = async (styleId) => {
  try {
    const response = await axios.get(`${MERCH_API_DOMAIN_NAME}/merchv3/products/${styleId}`);
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

router.get('/styles/:styleId', async (req, res) => {
  const { styleId } = req.params;
  const url = `${process.env.backContryAPI}/dataNormalization/rest/products/${styleId}`;
  console.log(url);
  try {
    const {
      data: {
        item: { brand, productTitle }
      }
    } = await axios.get(url, getConfig(req));

    res.sendResponse({ styleId, brand: brand.name, title: productTitle });
  } catch (error) {
    console.error(error.message);
    res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/styles/:styleId/techSpecs', async (req, res) => {
  const { styleId } = req.params;
  const url = `${process.env.backContryAPI}/dataNormalization/rest/products/${styleId}`;
  console.log(url);
  try {
    const {
      data: {
        item: { techSpecs }
      }
    } = await axios.get(url, getConfig(req));

    res.sendResponse(techSpecs);
  } catch (error) {
    console.error(error.message);
    res.sendResponse('Internal Server Error', 500);
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
      `${ATTRIBUTE_API_DOMAIN_NAME}/attribute-api/styles/${styleId}`
    );

    const labels = data.harmonizingAttributeLabels
      .map((e) => e.harmonizingAttributeValues.map((l) => l.id))
      .flat(Infinity);

    const techSpecLabels = await postgresPrisma.$queryRaw`
      select da.id, da.name from dn_attributeorder dao 
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

    return res.sendResponse({
      hattributes,
      techSpecs: [
        ...data.techSpecs.filter(
          ({ label }) => !techSpecLabels?.map(({ name }) => name)?.includes(label)
        ),
        ...techSpecLabels.map((e) => ({
          ...e,
          label: e.name,
          value: data?.techSpecs?.find((l) => l?.label === e?.name)?.value || ''
        }))
      ]
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
      SELECT da.id, da.name from dn_attributeorder dao 
        inner join DN_Genus_AttributeL_AttributeType gal on dao.galatid = gal.id
        inner join dn_attributel da on da.id=gal.attributelid
        where gal.genusid =${parseInt(genusId)} and dao.dattributevid =${parseInt(speciesId)}
        order by dao.position`;

    const { data } = await axios.get(
      `${ATTRIBUTE_API_DOMAIN_NAME}/attribute-api/styles/${styleId}`
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

    return res.sendResponse({
      hattributes,
      techSpecs: [
        ...data.techSpecs.filter(
          ({ label }) => !techSpecLabels?.map(({ name }) => name)?.includes(label)
        ),
        ...techSpecLabels.map((e) => ({
          ...e,
          label: e.name,
          value: data?.techSpecs?.find((l) => l?.label === e?.name)?.value || ''
        }))
      ]
    });
  } catch (error) {
    console.error(error.message);
    return res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/merchProduct/:styleId', async (req, res) => {
  try {
    const { styleId } = req.params;
    const { data } = await axios.get(`${MERCH_API_DOMAIN_NAME}/merchv3/products/${styleId}`);
    return res.sendResponse({ data });
  } catch (error) {
    console.error(error.message);
    return res.sendResponse('Internal Server Error', 500);
  }
});

router.post('/styleSearch', validateMiddleware({ body: getProductsDto }), async (req, res) => {
  try {
    const {
      body: { styles }
    } = req;
    const success = [];
    const failures = [];

    await Promise.all(
      styles.map(async (styleId) => {
        try {
          const { data } = await axios.get(`${MERCH_API_DOMAIN_NAME}/merchv3/products/${styleId}`);
          const { style, title, brandName, lastModified, lastModifiedUsername } = data;
          success.push({ style, title, brandName, lastModified, lastModifiedUsername });
        } catch (err) {
          failures.push(styleId);
        }
      })
    );

    return res.sendResponse({ success, failures });
  } catch (error) {
    console.error(error.message);
    return res.sendResponse('Error occured while searching for styles', 500);
  }
});

router.get('/productInfo/:styleId', async (req, res) => {
  try {
    const { styleId } = req.params;
    const results = await Promise.allSettled([
      axios.get(`${COPY_API_DOMAIN_NAME}/copy-api/published-copy/${styleId}`),
      axios.get(`${ATTRIBUTE_API_DOMAIN_NAME}/attribute-api/styles/${styleId}`),
      axios.get(`${MERCH_API_DOMAIN_NAME}/merchv3/products/${styleId}`),
      axios.get(`${MERCH_API_DOMAIN_NAME}/merchv3/size-charts?shouldSkipChart=true`)
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
  getStyle
};
