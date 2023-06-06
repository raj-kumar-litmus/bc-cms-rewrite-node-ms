const express = require('express');
const axios = require('axios');

const { postgresPrisma } = require('../prisma');
const { groupBy } = require('../../utils');

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

// router.get('/hattribute/:hattributeId', async (req, res) => {
//   try {
//     const { hattributeId } = req.params;
//     const hAttributes = await postgresPrisma.dn_hattributev.findMany({
//       where: {
//         id: parseInt(hattributeId)
//       }
//     });
//     return res.sendResponse(hAttributes);
//   } catch (error) {
//     console.error(error.message);
//     res.send('Internal Server Error').status(500);
//   }
// });

// router.get('/hattribute/genus/:genusid', async (req, res) => {
//   try {
//     const { genusid } = req.params;
//     const hAttributes = await postgresPrisma.dn_genus_hattributev.findMany({
//       where: {
//         genusid: parseInt(genusid)
//       }
//     });
//     return res.sendResponse(hAttributes);
//   } catch (error) {
//     console.error(error.message);
//     res.send('Internal Server Error').status(500);
//   }
// });

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

router.get('/genus/:genusId/species/:speciesId/hAttributes', async (req, res) => {
  try {
    const { genusId, speciesId } = req.params;

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

    const { data } = await axios.get(
      `${process.env.ATTRIBUTE_API_PROD}/attribute-api/styles/TNFZCQX`, //todo. pass style id and remove hard-coding
      getConfig(req)
    );

    const labels = data.harmonizingAttributeLabels
      .map((e) => e.harmonizingAttributeValues.map((l) => l.id))
      .flat(Infinity);
    const hattributes = {};
    Object.keys(groupedHAttributes).forEach((el) => {
      hattributes[el] = groupedHAttributes[el].map((e) =>
        !labels.includes(e.hattributevid) ? e : { ...e, selected: true }
      );
    });

    return res.sendResponse({
      hattributes,
      techSpecs: data.techSpecs
    });
  } catch (error) {
    console.error(error.message);
    res.sendResponse('Internal Server Error', 500);
  }
});

module.exports = router;
