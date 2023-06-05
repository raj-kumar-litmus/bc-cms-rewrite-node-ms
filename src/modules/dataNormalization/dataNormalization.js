const express = require('express');
const axios = require('axios');

const { postgresPrisma } = require('../prisma');

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
    let genus;
    if (!page) {
      genus = await postgresPrisma.dn_genus.findMany({});
      return res.sendResponse(genus);
    }
    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);

    if (Number.isNaN(parsedLimit) || Number.isNaN(parsedPage)) {
      return res.sendResponse('Invalid page or limit value.', 400);
    }

    const skip = (parsedPage - 1) * parsedLimit;
    // Query the database using Prisma Client
    const response = await Promise.all([
      postgresPrisma.dn_genus.findMany({
        skip,
        take: parsedLimit
      }),
      postgresPrisma.dn_genus
        .findMany({})
        .then((result) => result.length)
        .catch(() => 0)
    ]);
    genus = response[0];
    const total = response[1];
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
    return res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/genus/:genusId/species', async (req, res) => {
  try {
    const { genusId } = req.params;
    let dattributeLabel;

    const genus = await postgresPrisma.dn_genus.findUnique({
      where: {
        id: parseInt(genusId)
      },
      select: {
        id: true,
        dattributelid: true
      }
    });

    if (genus.dattributelid) {
      const dAttributes = await postgresPrisma.dn_dattributev.findMany({
        where: {
          dattributelid: parseInt(genus.dattributelid)
        }
      });
      const genuAttributeElAttributeType =
        await postgresPrisma.dn_genus_attributel_attributetype.findMany({
          where: {
            genusid: parseInt(genusId)
          }
        });
      if (dAttributes && Array.isArray(dAttributes) && dAttributes[0]) {
        const { dattributelid } = dAttributes[0];
        dattributeLabel = await postgresPrisma.dn_dattributel.findMany({
          where: {
            id: parseInt(dattributelid)
          }
        });
      }
      return res.sendResponse({
        label: dattributeLabel,
        species: dAttributes.filter((e) => {
          return genuAttributeElAttributeType.find((el) => el.dattributevid === e.id);
        })
      });
    }
    return res.sendResponse('Could not find genus details', 404);
  } catch (error) {
    return res.sendResponse('Internal Server Error', 500);
  }
});

// router.get('/genus/:genusId/species/:speciesId/hAttributes', async (req, res) => {
//   try {
//     const { genusId, speciesId } = req.params;
//     const harmonizingAttributes = await postgresPrisma.dn_genus_species_hattributev.findMany({
//       where: {
//         AND: [{ genus_id: parseInt(genusId) }, { species_id: parseInt(speciesId) }]
//       }
//     });
//     const genus = await postgresPrisma.dn_genus.findUnique({
//       where: {
//         id: parseInt(genusId)
//       },
//       select: {
//         id: true,
//         dattributelid: true
//       }
//     });
//     const newResp = await postgresPrisma.dn_hattributev.findMany({
//       where: {
//         hattributelid: parseInt(genus.dattributelid)
//         // id: parseInt(genusId)
//       }
//     });
//     // todo. JAR call integration.
//     res.sendResponse({
//       harmonizingAttributes,
//       newResp
//     });
//   } catch (error) {
//     console.error(error.message);
//     res.sendResponse('Internal Server Error', 500);
//   }
// });

module.exports = router;
