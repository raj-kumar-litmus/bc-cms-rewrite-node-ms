const express = require('express');
const axios = require('axios');
const Joi = require('joi');

const router = express.Router();

const { postgresPrisma } = require('../prisma');
const { logger } = require('../../lib/logger');
const { authorize, validateMiddleware } = require('../../middlewares');
const { groups } = require('../../properties');
const {
  getSizeMappingDto,
  getStandardScaleDto,
  scaleSchema,
  createSizeValueDto,
  arrayOfSizeMappingsSchema
} = require('./dtos');

router.get('/scales/all', async (req, res) => {
  try {
    const scales = await postgresPrisma.$queryRaw`select * from dn_scales`;
    return res.sendResponse({
      scales: scales.sort((a, b) => a?.name.localeCompare(b?.name))
    });
  } catch (error) {
    logger.error({ error }, 'Error occured while fetching scales');
    return res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/scales/details/:scaleid', async (req, res) => {
  try {
    const { scaleid } = req.params;
    const scales = await postgresPrisma.$queryRaw`select * from dn_sizes where scaleid=${parseInt(
      scaleid
    )}`;
    return res.sendResponse({
      scales
    });
  } catch (error) {
    logger.error({ error }, 'Error occured while fetching scale details');
    return res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/sizevalues', async (req, res) => {
  try {
    const scales = await postgresPrisma.$queryRaw`select * from dn_sizevalues`;
    return res.sendResponse({
      scales
    });
  } catch (error) {
    logger.error({ error }, 'Error occured while fetching size values');
    return res.sendResponse('Internal Server Error', 500);
  }
});

router.get('/productgroups', async (req, res) => {
  try {
    const { data: productgroups } = await axios.get(
      'http://merch01.bcinfra.net:8080/merchv3/light-product-groups'
    );
    return res.sendResponse({
      productgroups: productgroups.sort((a, b) => a?.name.localeCompare(b?.name))
    });
  } catch (error) {
    logger.error({ error }, 'Error occured while fetching productgroups');
    return res.sendResponse('Internal Server Error', 500);
  }
});

const createScale = async (req, res) => {
  try {
    const { name, description, sizes } = req.body;

    const createdScale = await postgresPrisma.dn_scales.create({
      data: {
        name,
        description,
        dn_sizes: {
          create: sizes
        }
      },
      include: {
        dn_sizes: true
      }
    });

    res.sendResponse(createdScale, 201);
  } catch (error) {
    console.error(error);
    res.sendResponse('Error occurred while creating the scale', 500);
  }
};

router.post(
  '/scales',
  authorize([
    groups.ADMIN_GROUP_NAME,
    groups.WRITER_GROUP_NAME,
    groups.EDITOR_GROUP_NAME,
    groups.SIZING_GROUP_NAME
  ]),
  validateMiddleware({
    body: scaleSchema
  }),
  createScale
);

const updateScale = async (req, res) => {
  try {
    const { scaleId } = req.params;
    const { name, description, sizes } = req.body;

    const updatedScale = await postgresPrisma.dn_scales.update({
      where: { id: parseInt(scaleId) },
      data: {
        name,
        description,
        dn_sizes: {
          upsert: sizes.map((size) => ({
            where: { id: size.id ? parseInt(size.id) : -1 },
            create: size,
            update: size
          }))
        }
      },
      include: {
        dn_sizes: true
      }
    });

    return res.sendResponse(updatedScale, 200);
  } catch (error) {
    if (error.code === 'P2025') {
      logger.error(
        { error },
        'Error occurred while updating the scale: dn_scales record not found'
      );
      return res.sendResponse('Scale not found', 404);
    }
    logger.error({ error }, 'Error occurred while updating the scale');
    return res.sendResponse('Error occurred while updating the scale', 500);
  }
};

router.put(
  '/scales/:scaleId',
  authorize([
    groups.ADMIN_GROUP_NAME,
    groups.WRITER_GROUP_NAME,
    groups.EDITOR_GROUP_NAME,
    groups.SIZING_GROUP_NAME
  ]),
  validateMiddleware({
    body: scaleSchema
  }),
  updateScale
);

const setPreferredScaleForProductGroup = async (req, res) => {
  try {
    const { productgroupId, scaleId } = req.params;

    const mostRecentPreferredScale = await postgresPrisma.dn_preferredscales.findFirst({
      where: {
        productgroup: parseInt(productgroupId)
      },
      orderBy: {
        last_modified: 'desc'
      },
      take: 1
    });

    const upsertResult = await postgresPrisma.dn_preferredscales.upsert({
      where: {
        id: mostRecentPreferredScale?.id || -1
      },
      update: {
        scaleid: parseInt(scaleId)
      },
      create: {
        productgroup: parseInt(productgroupId),
        scaleid: parseInt(scaleId),
        brand: 0
      }
    });

    return res.sendResponse(upsertResult, 201);
  } catch (error) {
    const { stack, message } = error;
    logger.error({ error, stack, message }, 'Error occurred while updating the preferred Scale');
    return res.sendResponse('Error occurred while updating the preferred Scale', 500);
  }
};

router.put(
  '/productgroups/:productgroupId/preferredScale/:scaleId',
  authorize([
    groups.ADMIN_GROUP_NAME,
    groups.WRITER_GROUP_NAME,
    groups.EDITOR_GROUP_NAME,
    groups.SIZING_GROUP_NAME
  ]),
  setPreferredScaleForProductGroup
);

router.post(
  '/sizevalue/add',
  authorize([
    groups.ADMIN_GROUP_NAME,
    groups.WRITER_GROUP_NAME,
    groups.EDITOR_GROUP_NAME,
    groups.SIZING_GROUP_NAME
  ]),
  validateMiddleware({ body: createSizeValueDto }),
  async (req, res) => {
    try {
      const { name, description } = req.body;
      await postgresPrisma.$queryRaw`INSERT INTO dn_sizevalues(name,description) VALUES (${name},${description});`;
      return res.sendResponse({});
    } catch (error) {
      logger.error({ error }, 'Error occured while inserting size values');
      return res.sendResponse('Internal Server Error', 500);
    }
  }
);

const getSizeMappings = async (scaleId, preferredScaleId) => {
  try {
    const result = await postgresPrisma.$queryRaw`
      SELECT smp.* FROM dn_sizemappings smp 
      JOIN dn_sizes sz ON smp.size = sz.id 
      JOIN dn_scales sc ON sz.scaleid = sc.id
      JOIN dn_sizes psz ON smp.preferredsize = psz.id
      JOIN dn_scales psc ON psz.scaleid = psc.id
      WHERE sc.id = ${parseInt(scaleId)} AND psc.id = ${parseInt(preferredScaleId)}
      order by psz.position, sz.position;
    `;
    return result;
  } catch (error) {
    logger.error({ error }, 'Error occurred while fetching size mappings');
    throw error;
  }
};

const insertSizeMappings = async (sizeMappingsData) => {
  try {
    const createdMappings = await Promise.all(
      sizeMappingsData.map(async (mapping) => {
        const createdMapping = await postgresPrisma.dn_sizemappings.create({
          data: {
            dn_sizes_dn_sizemappings_sizeTodn_sizes: {
              connect: { id: parseInt(mapping.sizeId) }
            },
            dn_sizes_dn_sizemappings_preferredsizeTodn_sizes: {
              connect: { id: parseInt(mapping.preferredSizeId) }
            }
          }
        });

        return createdMapping;
      })
    );

    logger.info({ createdMappings }, 'Successfully inserted size mappings');
  } catch (error) {
    logger.error({ error }, 'Error occurred while inserting size mappings');
  } finally {
    await postgresPrisma.$disconnect();
  }
};

const deleteSizeMappings = async (mappingIds) => {
  try {
    await postgresPrisma.dn_sizemappings.deleteMany({
      where: {
        id: {
          in: mappingIds
        }
      }
    });

    logger.info({ mappingIds }, 'Successfully deleted size mappings');
  } catch (error) {
    logger.error({ error }, 'Error occurred while deleting size mappings');
  } finally {
    await postgresPrisma.$disconnect();
  }
};

router.post(
  '/sizeMapping/:preferredScaleId/:scaleId',
  authorize([
    groups.ADMIN_GROUP_NAME,
    groups.WRITER_GROUP_NAME,
    groups.EDITOR_GROUP_NAME,
    groups.SIZING_GROUP_NAME
  ]),
  validateMiddleware({ body: arrayOfSizeMappingsSchema }),
  async (req, res) => {
    try {
      const { preferredScaleId, scaleId } = req.params;
      const sizeMappings = req.body;

      const existingSizeMappings = await getSizeMappings(scaleId, preferredScaleId);

      await deleteSizeMappings(existingSizeMappings.map(({ id }) => id));

      await insertSizeMappings(sizeMappings);

      return res.sendResponse();
    } catch (error) {
      logger.error({ error }, 'Error occurred while creating size mappings');
      return res.sendResponse('Error occurred while creating size mappings', 500);
    }
  }
);

router.get(
  '/sizemapping/preferredscale/:prefferedscale/standardscale/:standardscale',
  validateMiddleware({ params: getSizeMappingDto }),
  async (req, res) => {
    try {
      const { prefferedscale, standardscale } = req.params;
      const sizeMapping =
        await postgresPrisma.$queryRaw`select sz.id as standardScaleId, psz.id as prefferedScaleId, sz.description as standardScaleDescription, psz.description as prefferedScaleDescription from dn_sizemappings smp
      join dn_sizes sz on smp.size = sz.id
      join dn_scales sc on sz.scaleid = sc.id 
      join dn_sizes psz on smp.preferredsize = psz.id
      join dn_scales psc on psz.scaleid = psc.id
      where sc.id = ${parseInt(standardscale)} and psc.id =  ${parseInt(prefferedscale)}
      order by psz.description;`;
      return res.sendResponse({
        sizeMapping
      });
    } catch (err) {
      logger.error({ err }, 'Error occured while fetching size mapping');
      return res.sendResponse('Internal Server Error', 500);
    }
  }
);

router.delete(
  '/sizeMapping/:preferredScaleId',
  authorize([
    groups.ADMIN_GROUP_NAME,
    groups.WRITER_GROUP_NAME,
    groups.EDITOR_GROUP_NAME,
    groups.SIZING_GROUP_NAME
  ]),
  validateMiddleware({ body: Joi.array().items(Joi.number().integer()) }),
  async (req, res) => {
    try {
      const { preferredScaleId } = req.params;
      const scales = req.body;

      for (const scaleId of scales) {
        const existingSizeMappings = await getSizeMappings(scaleId, preferredScaleId);
        await deleteSizeMappings(existingSizeMappings.map(({ id }) => id));
      }

      return res.sendResponse('Size mappings deleted successfully');
    } catch (error) {
      logger.error({ error }, 'Error occurred while deleting size mappings:');
      return res.sendResponse('Error occurred while deleting size mappings', 500);
    }
  }
);

router.get(
  '/standardscale/:prefferedscaleid',
  validateMiddleware({ params: getStandardScaleDto }),
  async (req, res) => {
    try {
      const { prefferedscaleid } = req.params;
      const standardScales =
        await postgresPrisma.$queryRaw`SELECT DISTINCT sc.id, sc.name FROM dn_sizemappings AS smp JOIN dn_sizes AS sz ON smp.size = sz.id
        JOIN dn_scales AS sc ON sz.scaleid = sc.id JOIN dn_sizes AS psz ON smp.preferredsize = psz.id
        JOIN dn_scales AS psc ON psz.scaleid = psc.id
        WHERE psc.id = ${parseInt(prefferedscaleid)}
        AND psc.id = psz.scaleid AND psz.id = smp.preferredsize
        AND sc.id = sz.scaleid AND sz.id = smp.size;`;
      return res.sendResponse({
        standardScales
      });
    } catch (err) {
      logger.error({ err }, 'Error occured while fetching standard scales');
      return res.sendResponse('Internal Server Error', 500);
    }
  }
);

router.get('/prefferedscale', async (req, res) => {
  try {
    const prefferedscale =
      await postgresPrisma.$queryRaw`select ps.id, ps.scaleid, ps.productgroup, ps.brand, ds.name from DN_PreferredScales ps
      join dn_scales ds on ps.scaleid = ds.id order by ds.name;`;
    return res.sendResponse({
      prefferedscale
    });
  } catch (err) {
    logger.error({ err }, 'Error occured while fetching preffered scales');
    return res.sendResponse('Internal Server Error', 500);
  }
});

module.exports = router;
