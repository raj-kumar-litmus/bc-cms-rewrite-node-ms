/* eslint-disable consistent-return */
const request = require('supertest');
const axios = require('axios');
const app = require('../../../app');

jest.mock('axios');

const mockAttributeApi = () => {
  axios.get.mockImplementation((url) => {
    if (url.includes('/attribute-api/styles/')) {
      return Promise.resolve({
        data: {
          harmonizingAttributeLabels: [
            {
              harmonizingAttributeValues: [{ id: 200004187 }]
            }
          ]
        }
      });
    }
  });
};

const mockAttributeApiError = () => {
  axios.get.mockImplementation((url) => {
    if (url.includes('/attribute-api/styles/')) {
      return Promise.resolve({
        data: [
          {
            id: 200004187,
            name: 'Gear Care - PS'
          },
          {
            id: 100003661,
            name: 'Avalanche Safety Gear - PS'
          }
        ]
      });
    }
  });
};

const merchantProductApi = () => {
  axios.get.mockImplementation((url) => {
    if (url.includes('/merchv3/products')) {
      return Promise.resolve({
        data: [
          {
            id: 200004187,
            name: 'Gear Care - PS'
          },
          {
            id: 100003661,
            name: 'Avalanche Safety Gear - PS'
          }
        ]
      });
    }
  });
};

const merchantVendorProductApi = () => {
  axios.get.mockImplementation((url) => {
    if (url.includes('/merchv3/vendor-skus')) {
      return Promise.resolve({
        data: [
          {
            id: 200004187,
            name: 'Gear Care - PS'
          },
          {
            id: 100003661,
            name: 'Avalanche Safety Gear - PS'
          }
        ]
      });
    }
  });
};

jest.mock('../../../../prisma/node_modules/.prisma/client/postgres', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $queryRaw: ([query]) => {
      if (query === 'select * from dn_sizevalues') {
        return [
          {
            id: 1,
            name: '700x330c',
            description: ''
          },
          {
            id: 2,
            name: '700x331c',
            description: ''
          }
        ];
      }
      if (query.includes('select * from dn_sizes ds where ds.scaleid=')) {
        return [
          {
            id: 297,
            scaleid: 7,
            name: 'Long',
            description: 'Long',
            position: 6,
            last_modified: '2018-12-10T12:24:01.000Z'
          },
          {
            id: 4453,
            scaleid: 7,
            name: 'Extra Large',
            description: 'Extra Large',
            position: 5,
            last_modified: '2018-12-10T12:24:01.000Z'
          }
        ];
      }
      if (query === 'select * from dn_scales') {
        return [
          {
            id: 161,
            name: 'Hats Alphabetical Slash',
            description: 'Hats Alphabetical Slash',
            last_modified: '2016-10-14T08:51:37.000Z'
          },
          {
            id: 162,
            name: "Women's Alphabetical(with Shape A/H)",
            description: "Women's Alphabetical(with Shape A/H)",
            last_modified: '2016-10-14T08:51:37.000Z'
          }
        ];
      }
      if (query.includes('SELECT smp.* FROM dn_sizemappings smp ')) {
        return [
          {
            id: 161
          },
          {
            id: 162
          },
          {
            id: 163
          },
          {
            id: 164
          }
        ];
      }
      if (query.includes('INSERT INTO dn_sizevalues(name,description) VALUES')) {
        return true;
      }
      if (query.includes('from DN_PreferredScales')) {
        return { scale: 'scale-123' };
      }
      if (query.includes('SELECT DISTINCT sc.id, sc.name FROM dn_sizemappings')) {
        return { scale: 'scale-456' };
      }
      if (
        query.includes(
          'select sz.id as standardScaleId, psz.id as prefferedScaleId, sz.description as standardScaleDescription, psz.description as prefferedScaleDescription from dn_sizemappings sm'
        )
      ) {
        return { mapping: '98765' };
      }
      if (
        query.includes(
          'SELECT s.hattributev_id, hattr.text, hattr.hattributelid, label.name FROM dn_genus_species_hattributev s'
        )
      ) {
        return [{ hattributev_id: 732, text: 'Bar End', hattributelid: 185, name: 'Shifter Type' }];
      }
      if (
        query.includes(
          'SELECT dgh.hattributevid, hattr.text,  hattr.hattributelid, label.name from dn_genus_hattributev dgh'
        )
      ) {
        return [
          { hattributevid: 557, text: 'Downhill', hattributelid: 120, name: 'Recommended Use' },
          { hattributevid: 1390, text: 'Commuting', hattributelid: 120, name: 'Recommended Use' },
          { hattributevid: 1667, text: 'Triathlon', hattributelid: 120, name: 'Recommended Use' },
          { hattributevid: 2977, text: 'Tier 1', hattributelid: 422, name: 'Content Treatment' },
          { hattributevid: 2978, text: 'Tier 2', hattributelid: 422, name: 'Content Treatment' },
          { hattributevid: 2979, text: 'Tier 3', hattributelid: 422, name: 'Content Treatment' }
        ];
      }
      if (
        query.includes(
          'SELECT s.hattributevid , hattr.text, hattr.hattributelid, label.name FROM dn_genus_hattributev'
        )
      ) {
        return [
          { hattributevid: 557, text: 'Downhill', hattributelid: 120, name: 'Recommended Use' },
          { hattributevid: 2242, text: 'Anti-Fog Lens', hattributelid: 259, name: 'Features' },
          { hattributevid: 2859, text: 'Enduro', hattributelid: 120, name: 'Recommended Use' },
          { hattributevid: 1091, text: 'GPS', hattributelid: 259, name: 'Features' },
          { hattributevid: 2273, text: 'Limited Edition', hattributelid: 367, name: 'Special' },
          { hattributevid: 2246, text: 'Polarized Lens', hattributelid: 259, name: 'Features' }
        ];
      }
      if (
        query.includes(
          'SELECT da.id, da.name as label, MAX(dao.id) as labelId, MIN(dao.position)as order from dn_attributeorder dao'
        )
      ) {
        return [
          { id: 103, label: 'Case Included', labelid: 19858, order: 12 },
          { id: 113, label: 'Claimed Weight', labelid: 19859, order: 13 },
          { id: 336, label: 'Manufacturer Warranty', labelid: 24185, order: 2147483647 },
          { id: 518, label: 'Polarized', labelid: 19854, order: 4 },
          { id: 571, label: 'Face Size', labelid: 19857, order: 10 },
          { id: 810, label: 'Frame', labelid: 15049, order: 1 },
          { id: 812, label: 'Interchangeable Lens', labelid: 19856, order: 6 },
          { id: 813, label: 'Lens', labelid: 15039, order: 1 },
          { id: 1319, label: 'Strap', labelid: 15040, order: 4 },
          { id: 1322, label: 'Photochromic', labelid: 19853, order: 5 },
          { id: 1519, label: 'Technical Features', labelid: 19855, order: 7 },
          { id: 1723, label: 'Responsible Collection', labelid: 22793, order: 2 },
          { id: 1742, label: 'Activity', labelid: 24184, order: 2147483647 }
        ];
      }
    },
    dn_genus: {
      findMany: () => ({}),
      count: () => 124
    }
  }))
}));

jest.mock('../../../../prisma/node_modules/.prisma/client/mongo', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    workbenchAudit: {
      findFirst: () => ({}),
      findMany: () => [
        { id: 123, style: 1234 },
        { id: 234, style: 2345 },
        { id: 345, style: 3456 }
      ],
      findFirstOrThrow: () => {
        return {
          id: '64afdff559cab44dee9283df',
          assignee: null,
          bulletPoints: [],
          competitiveCyclistDescription: null,
          competitiveCyclistTopline: null,
          detailedDescription:
            "<p>The bright colors and popping patterns of the Bell Kids' Span Helmet make staying protected exponentially more fun. Add in an adjustment system that mirrors the one found in adult-sized helmets, and you've got an ideal blend of comfort and style that'll have your kid reaching for this helmet before you even have to mention it. For summer days, 10 vents across the helmet usher in cooling airflow for additional comfort and motivation to keep riding in helmet-clad safety.</p>",
          isPublished: true,
          listDescription: null,
          productTitle: null,
          status: null,
          topLine: null,
          versionReason: null,
          createTs: '2023-07-13T11:28:53.908Z',
          createdBy: 'pc.admin@backcountry.com',
          auditType: 'DATA_NORMALIZATION',
          workflowId: '649c594bfee176942fabbe67',
          lastEditCompleteTs: null,
          lastWriteCompleteTs: null,
          editor: null,
          writer: null,
          version: 13,
          competitiveCyclistBottomLine: 'Top line',
          bottomLine: "Child's play.",
          genus: { id: 324 },
          species: { id: 1008 },
          harmonizingAttributeLabels: [],
          techSpecs: [],
          sizingChart: { id: 1053 },
          changeLog: {
            status: 'WRITING_COMPLETE',
            lastWriteCompleteTs: '2023-07-13T11:28:41.245Z',
            lastUpdatedBy: 'pc.admin@backcountry.com',
            genus: { id: { oldValue: 483, newValue: 324 } },
            isPublished: { oldValue: null, newValue: true },
            version: { oldValue: 12, newValue: 13 }
          }
        };
      },
      createMany: () => ({}),
      create: () => ({}),
      count: () => 459
    },
    workflow: {
      findUniqueOrThrow: (id) => {
        if (id === 'SAMPLE_WORKFLOW_ID') {
          return { id };
        }
        if (id === 'INVALID_WORKFLOW_ID') {
          const error = new Error('Invalid workflow id !!!');
          error.code = 'P2023';
          return { id };
        }
        if (id === 'MISSING_WORKFLOW_ID') {
          const error = new Error('Missing workflow id !!!');
          error.code = 'P2025';
          return { id };
        }
        return { id };
      },
      findMany: (payload) => {
        if (payload.where.OR.styleId.in.includes('EXISTING_WORKFLOW')) {
          return payload.where.OR.styleId.in.map((e) => ({
            status: 'ASSIGNED_TO_WRITER',
            assignee: 'pc.writer@backcountry.com',
            styleId: e
          }));
        }
        return [
          {
            status: 'ASSIGNED_TO_WRITER',
            assignee: 'pc.writer@backcountry.com',
            id: 1234
          },
          {
            status: 'ASSIGNED_TO_WRITER',
            assignee: 'pc.writer@backcountry.com',
            id: 3456
          },
          {
            status: 'ASSIGNED_TO_EDITOR',
            assignee: 'pc.writer@backcountry.com',
            id: 5678
          }
        ];
      },
      update: () => ({}),
      updateMany: () => ({ count: 1 }),
      create: ({ data: { brand, title, styleId } }) => ({
        brand,
        title,
        styleId
      }),
      createMany: () => ({}),
      count: () => 124
    },
    $disconnect: () => {}
  }))
}));

describe('/api/v1/dataNormalization/genus, it should return 200', () => {
  test('it should return the mocked response', async () => {
    const response = await request(app).get('/api/v1/dataNormalization/genus');
    expect(response.statusCode).toEqual(200);
  });
  test('it should return the mocked response', async () => {
    const response = await request(app).get('/api/v1/dataNormalization/genus?page=1');
    expect(response.statusCode).toEqual(200);
  });
  test('it should return the error response', async () => {
    const response = await request(app).get('/api/v1/dataNormalization/genus?page=INVALID');
    expect(response.statusCode).toEqual(400);
    expect(response.body.error).toEqual(
      'Invalid page or limit value. Please provide valid numeric values for page and limit parameters.'
    );
  });
});

describe('/api/v1/dataNormalization/genus/:genusId/species, it should return 200', () => {
  test('it should return the success response', async () => {
    const response = await request(app).get('/api/v1/dataNormalization/genus/123/species');
    expect(response.statusCode).toEqual(200);
  });
});

describe('/api/v1/dataNormalization/genus/:genusId/hAttributes/:styleId, it should return 200', () => {
  test('it should return the success response', async () => {
    mockAttributeApi();
    const response = await request(app).get('/api/v1/dataNormalization/genus/123/hAttributes/123');
    expect(response.body.data).toEqual({
      hattributes: {
        Features: [
          { hattributelid: 259, hattributevid: 2242, name: 'Features', text: 'Anti-Fog Lens' },
          { hattributelid: 259, hattributevid: 1091, name: 'Features', text: 'GPS' },
          { hattributelid: 259, hattributevid: 2246, name: 'Features', text: 'Polarized Lens' }
        ],
        'Recommended Use': [
          { hattributelid: 120, hattributevid: 557, name: 'Recommended Use', text: 'Downhill' },
          { hattributelid: 120, hattributevid: 2859, name: 'Recommended Use', text: 'Enduro' }
        ],
        Special: [
          { hattributelid: 367, hattributevid: 2273, name: 'Special', text: 'Limited Edition' }
        ]
      },
      techSpecs: [
        { id: 103, label: 'Case Included', labelId: 103, order: 12 },
        { id: 113, label: 'Claimed Weight', labelId: 113, order: 13 },
        { id: 336, label: 'Manufacturer Warranty', labelId: 336, order: 2147483647 },
        { id: 518, label: 'Polarized', labelId: 518, order: 4 },
        { id: 571, label: 'Face Size', labelId: 571, order: 10 },
        { id: 810, label: 'Frame', labelId: 810, order: 1 },
        { id: 812, label: 'Interchangeable Lens', labelId: 812, order: 6 },
        { id: 813, label: 'Lens', labelId: 813, order: 1 },
        { id: 1319, label: 'Strap', labelId: 1319, order: 4 },
        { id: 1322, label: 'Photochromic', labelId: 1322, order: 5 },
        {
          id: 1519,
          label: 'Technical Features',
          labelId: 1519,
          order: 7
        },
        {
          id: 1723,
          label: 'Responsible Collection',
          labelId: 1723,
          order: 2
        },
        {
          id: 1742,
          label: 'Activity',
          labelId: 1742,
          order: 2147483647
        }
      ]
    });
  });
});

describe('/api/v1/dataNormalization/genus/:genusId/species/:speciesId/hAttributes/:styleId', () => {
  test('it should return the mocked response 500 error', async () => {
    mockAttributeApiError();
    const response = await request(app).get(
      '/api/v1/dataNormalization/genus/abc/species/abc/hAttributes/abc'
    );
    expect(response.statusCode).toEqual(500);
    expect(response.body.success).toEqual(false);
  });

  test('it should return the success response', async () => {
    mockAttributeApi();
    const response = await request(app).get(
      '/api/v1/dataNormalization/genus/abc/species/abc/hAttributes/abc'
    );
    expect(response.statusCode).toEqual(200);
    expect(response.body.data).toEqual({
      hattributes: {
        'Content Treatment': [
          { hattributelid: 422, hattributevid: 2977, name: 'Content Treatment', text: 'Tier 1' },
          { hattributelid: 422, hattributevid: 2978, name: 'Content Treatment', text: 'Tier 2' },
          { hattributelid: 422, hattributevid: 2979, name: 'Content Treatment', text: 'Tier 3' }
        ],
        'Recommended Use': [
          { hattributelid: 120, hattributevid: 557, name: 'Recommended Use', text: 'Downhill' },
          { hattributelid: 120, hattributevid: 1390, name: 'Recommended Use', text: 'Commuting' },
          { hattributelid: 120, hattributevid: 1667, name: 'Recommended Use', text: 'Triathlon' }
        ],
        'Shifter Type': [
          {
            hattributelid: 185,
            hattributev_id: 732,
            hattributevid: 732,
            name: 'Shifter Type',
            text: 'Bar End'
          }
        ]
      },
      techSpecs: [
        { id: 103, label: 'Case Included', labelId: 103, order: 12 },
        { id: 113, label: 'Claimed Weight', labelId: 113, order: 13 },
        { id: 336, label: 'Manufacturer Warranty', labelId: 336, order: 2147483647 },
        { id: 518, label: 'Polarized', labelId: 518, order: 4 },
        { id: 571, label: 'Face Size', labelId: 571, order: 10 },
        { id: 810, label: 'Frame', labelId: 810, order: 1 },
        { id: 812, label: 'Interchangeable Lens', labelId: 812, order: 6 },
        { id: 813, label: 'Lens', labelId: 813, order: 1 },
        { id: 1319, label: 'Strap', labelId: 1319, order: 4 },
        { id: 1322, label: 'Photochromic', labelId: 1322, order: 5 },
        {
          id: 1519,
          label: 'Technical Features',
          labelId: 1519,
          order: 7
        },
        {
          id: 1723,
          label: 'Responsible Collection',
          labelId: 1723,
          order: 2
        },
        {
          id: 1742,
          label: 'Activity',
          labelId: 1742,
          order: 2147483647
        }
      ]
    });
  });
});

describe('/api/v1/dataNormalization/merchProduct/:styleId, it should return 200', () => {
  test('it should return the 200 response', async () => {
    merchantProductApi();
    const response = await request(app).get('/api/v1/dataNormalization/merchProduct/123');
    expect(response.statusCode).toEqual(200);
  });
});

describe('/api/v1/dataNormalization/styleSearch', () => {
  test('it should return 200 response', async () => {
    merchantProductApi();
    const response = await request(app)
      .post('/api/v1/dataNormalization/styleSearch')
      .set('Content-type', 'application/json')
      .send({ styles: ['testing'] });
    expect(response.body.data).toEqual({
      failures: ['testing'],
      success: [],
      workflowExists: [null, null, null]
    });
  });

  test('it should return success', async () => {
    merchantProductApi();
    const response = await request(app)
      .post('/api/v1/dataNormalization/styleSearch')
      .set('Content-type', 'application/json')
      .send({ styles: ['testing,testing1,testing2,EXISTING_WORKFLOW'] });
    expect(response.body.data).toEqual({
      failures: [],
      success: [],
      workflowExists: ['testing', 'testing1', 'testing2', 'EXISTING_WORKFLOW']
    });
  });
});

describe('/api/v1/dataNormalization/productInfo/:styleId', () => {
  test('it should return success response', async () => {
    merchantVendorProductApi();
    const response = await request(app).get('/api/v1/dataNormalization/productInfo/123');
    expect(response.statusCode).toEqual(200);
  });

  test('it should return the 404 response', async () => {
    const response = await request(app).get('/api/v1/dataNormalization/productInfo/');
    expect(response.statusCode).toEqual(404);
  });
});
