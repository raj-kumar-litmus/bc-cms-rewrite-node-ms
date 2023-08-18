/* eslint-disable consistent-return */
const request = require('supertest');
const axios = require('axios');
const app = require('../../../app');

jest.mock('axios');

axios.get.mockImplementation((url) => {
  if (url.includes('/merchv3/products/')) {
    if (url.includes('invalid')) {
      throw new Error();
    }
    if (url.includes('existing')) {
      const error = {
        code: 'P2002'
      };
      throw error;
    }
    return Promise.resolve({
      data: {
        brandName: 'NIKE',
        title: 'NIKE Air Shoe',
        style: 'TEST123'
      }
    });
  }
  if (url.includes('/copy-api/copy/')) {
    return Promise.resolve({
      data: {
        status: 'Published'
      }
    });
  }
  if (url.includes('/attribute-api/styles/')) {
    return Promise.resolve({
      data: {}
    });
  }
});

axios.put.mockImplementation((url) => {
  if (url.includes('/attribute-api/styles/')) {
    return Promise.resolve({
      success: true
    });
  }
  if (url.includes('/copy-api/copy/')) {
    return Promise.resolve({
      success: true
    });
  }
});

jest.mock('../../../../prisma/node_modules/.prisma/client/mongo', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    workbenchAudit: {
      findFirst: (payload) => {
        const {
          where: { workflowId }
        } = payload;
        if (workflowId === 'invalid') {
          throw new Error();
        }
        return {};
      },
      findMany: () => [
        { id: 123, style: 1234 },
        { id: 234, style: 2345 },
        { id: 345, style: 3456 }
      ],
      findFirstOrThrow: (payload) => {
        const {
          where: { id }
        } = payload;
        if (id === 'invalid') {
          throw new Error();
        }
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
      findUniqueOrThrow: (payload) => {
        const {
          where: { id }
        } = payload;
        if (id === 'SAMPLE_WORKFLOW_ID') {
          return { id };
        }
        if (id === 'INVALID_WORKFLOW_ID') {
          const error = new Error('Invalid workflow id !!!');
          error.code = 'P2023';
          throw error;
        } else if (id === 'MISSING_WORKFLOW_ID') {
          const error = new Error('Missing workflow id !!!');
          error.code = 'P2025';
          throw error;
        } else if (id === 'WRONG_WORKFLOW_ID') {
          const error = new Error();
          throw error;
        }
        return { id };
      },
      findMany: () => {
        return Promise.resolve([
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
        ]);
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

describe('/api/v1/workflows, it should return 200', () => {
  test('it should return 200 response', async () => {
    const response = await request(app)
      .post('/api/v1/workflows')
      .set('Content-type', 'application/json')
      .send({ styleId: 123 });
    // expect(response.body).toEqual({});
    expect(response.statusCode).toEqual(400);
  });
});

describe('/api/v1/workflows/bulk, it should return 200', () => {
  test('it should return 200 response', async () => {
    const response = await request(app)
      .post('/api/v1/workflows/bulk')
      .set('Content-type', 'application/json')
      .send({
        styles: [
          {
            styleId: 123,
            brand: 'testBrand',
            title: 'testTitle'
          }
        ]
      });
    // expect(response.body).toEqual({});
    expect(response.statusCode).toEqual(400);
  });
});

describe('/api/v1/workflows/search, it should return 200', () => {
  test('it should return 200 response', async () => {
    const response = await request(app)
      .post('/api/v1/workflows/search')
      .set('Content-type', 'application/json')
      .send({
        styleId: 123
      });
    // expect(response.body).toEqual({});
    expect(response.statusCode).toEqual(400);
  });
});

describe('/api/v1/workflows/constants, it should return 200', () => {
  test('it should return the expected response', async () => {
    const response = await request(app).get('/api/v1/workflows/constants');
    expect(response.statusCode).toEqual(200);
    expect(response.body).toEqual({
      data: {
        CreateProcess: { TOPIC: 'TOPIC', WRITER_INTERFACE: 'WRITER_INTERFACE' },
        Status: {
          ASSIGNED_TO_EDITOR: 'ASSIGNED_TO_EDITOR',
          ASSIGNED_TO_WRITER: 'ASSIGNED_TO_WRITER',
          EDITING_COMPLETE: 'EDITING_COMPLETE',
          EDITING_IN_PROGRESS: 'EDITING_IN_PROGRESS',
          WAITING_FOR_WRITER: 'WAITING_FOR_WRITER',
          WRITING_COMPLETE: 'WRITING_COMPLETE',
          WRITING_IN_PROGRESS: 'WRITING_IN_PROGRESS'
        },
        WorkflowAuditLogKeysEnum: {
          assignee: 'assignee',
          auditType: 'auditType',
          bulletPoints: 'bulletPoints',
          competitiveCyclistDescription: 'competitiveCyclistDescription',
          competitiveCyclistTopline: 'competitiveCyclistTopline',
          createTs: 'createTs',
          createdBy: 'createdBy',
          detailedDescription: 'detailedDescription',
          editor: 'editor',
          genus: 'genus',
          harmonizingData: 'harmonizingData',
          id: 'id',
          isPublished: 'isPublished',
          lastEditCompleteTs: 'lastEditCompleteTs',
          lastWriteCompleteTs: 'lastWriteCompleteTs',
          listDescription: 'listDescription',
          productTitle: 'productTitle',
          sizingChart: 'sizingChart',
          species: 'species',
          status: 'status',
          techSpecs: 'techSpecs',
          topLine: 'topLine',
          versionReason: 'versionReason',
          workflowId: 'workflowId',
          writer: 'writer'
        },
        WorkflowAuditType: { ASSIGNMENTS: 'ASSIGNMENTS', DATA_NORMALIZATION: 'DATA_NORMALIZATION' },
        WorkflowKeysEnum: {
          admin: 'admin',
          assignee: 'assignee',
          brand: 'brand',
          createProcess: 'createProcess',
          createTs: 'createTs',
          editor: 'editor',
          editorReview: 'editorReview',
          id: 'id',
          isPublished: 'isPublished',
          lastEditCompleteTs: 'lastEditCompleteTs',
          lastUpdateTs: 'lastUpdateTs',
          lastUpdatedBy: 'lastUpdatedBy',
          lastWriteCompleteTs: 'lastWriteCompleteTs',
          status: 'status',
          styleId: 'styleId',
          title: 'title',
          writer: 'writer'
        }
      },
      success: true
    });
  });
}); //

describe('/api/v1/workflows/counts, it should return 200', () => {
  test('it should return the expected response', async () => {
    const response = await request(app).get('/api/v1/workflows/counts');
    expect(response.statusCode).toEqual(200);
    expect(response.body.data).toEqual({
      assigned: 124,
      completed: 124,
      inProgress: 124,
      unassigned: 124
    });
  });
});

// describe('/api/v1/workflows/:id, it should return 200', () => {
//   test('it should return the mocked response', async () => {
//     const response = await request(app).get('/api/v1/workflows/64c04244256497b7142a728d');
//     expect(response.statusCode).toEqual(200);
//   });
// });

describe('/api/v1/workflows/:workflowId/history, it should return 200', () => {
  test('it should return the mocked response', async () => {
    const response = await request(app).get('/api/v1/workflows/64c04244256497b7142a728d/history');
    expect(response.body.data).toEqual({
      data: [
        { id: 123, style: 1234 },
        { id: 234, style: 2345 },
        { id: 345, style: 3456 }
      ],
      pagination: { currentPage: 1, currentPageCount: 3, pageCount: 46, total: 459 }
    });
  });
});

describe('/api/v1/workflows/:workflowId/history/:historyId, it should return 200', () => {
  test('it should return the expected response', async () => {
    const response = await request(app).get(
      '/api/v1/workflows/64c04244256497b7142a728d/history/64c04244256497b7142a728d'
    );
    expect(response.body.data).toEqual({
      auditType: 'DATA_NORMALIZATION',
      bottomLine: "Child's play.",
      bulletPoints: [],
      changeLog: {
        genus: { id: { newValue: 324, oldValue: 483 } },
        isPublished: { newValue: true, oldValue: null },
        lastUpdatedBy: 'pc.admin@backcountry.com',
        lastWriteCompleteTs: '2023-07-13T11:28:41.245Z',
        status: 'WRITING_COMPLETE',
        version: { newValue: 13, oldValue: 12 }
      },
      competitiveCyclistBottomLine: 'Top line',
      createTs: '2023-07-13T11:28:53.908Z',
      createdBy: 'pc.admin@backcountry.com',
      detailedDescription:
        "<p>The bright colors and popping patterns of the Bell Kids' Span Helmet make staying protected exponentially more fun. Add in an adjustment system that mirrors the one found in adult-sized helmets, and you've got an ideal blend of comfort and style that'll have your kid reaching for this helmet before you even have to mention it. For summer days, 10 vents across the helmet usher in cooling airflow for additional comfort and motivation to keep riding in helmet-clad safety.</p>",
      genus: { id: 324 },
      harmonizingAttributeLabels: [],
      id: '64afdff559cab44dee9283df',
      isPublished: true,
      sizingChart: { id: 1053 },
      species: { id: 1008 },
      techSpecs: [],
      version: 13
    });
  });
  test('it should return the error response', async () => {
    const response = await request(app).get(
      '/api/v1/workflows/64c04244256497b7142a728d/history/invalid'
    );
    expect(response.body.error).toEqual('An error occurred while getting workflow history.');
  });

  test('it should return the expected response', async () => {
    const response = await request(app).get(
      '/api/v1/workflows/64c04244256497b7142a728d/history/64c04244256497b7142a728d?styleId=BEL00C4'
    );
    expect(response.body.data).toEqual({
      auditType: 'DATA_NORMALIZATION',
      bottomLine: "Child's play.",
      bulletPoints: [],
      changeLog: {
        genus: { id: { newValue: 324, oldValue: 483 } },
        isPublished: { newValue: true, oldValue: null },
        lastUpdatedBy: 'pc.admin@backcountry.com',
        lastWriteCompleteTs: '2023-07-13T11:28:41.245Z',
        status: 'WRITING_COMPLETE',
        version: { newValue: 13, oldValue: 12 }
      },
      productInfo: {
        brandName: 'NIKE'
      },
      competitiveCyclistBottomLine: 'Top line',
      createTs: '2023-07-13T11:28:53.908Z',
      createdBy: 'pc.admin@backcountry.com',
      detailedDescription:
        "<p>The bright colors and popping patterns of the Bell Kids' Span Helmet make staying protected exponentially more fun. Add in an adjustment system that mirrors the one found in adult-sized helmets, and you've got an ideal blend of comfort and style that'll have your kid reaching for this helmet before you even have to mention it. For summer days, 10 vents across the helmet usher in cooling airflow for additional comfort and motivation to keep riding in helmet-clad safety.</p>",
      genus: { id: 324 },
      harmonizingAttributeLabels: [],
      id: '64afdff559cab44dee9283df',
      isPublished: true,
      sizingChart: { id: 1053 },
      species: { id: 1008 },
      techSpecs: [],
      version: 13
    });
  });
});

describe('Testing PATCH assign', () => {
  test('should return expected response', async () => {
    const response = await request(app)
      .patch('/api/v1/workflows/assign')
      .set('Content-type', 'application/json')
      .send({
        filters: {
          status: ['ASSIGNED_TO_WRITER', 'ASSIGNED_TO_EDITOR']
        },
        assignments: {
          writer: 'pc.admin@backcountry.com'
        }
      });
    expect(response.body.data.message).toEqual('2 workflows updated successfully');
  });
});

describe('Testing POST create workflow', () => {
  test('should return expected response', async () => {
    const response = await request(app)
      .post('/api/v1/workflows/')
      .set('Content-type', 'application/json')
      .send({
        styleId: 'TEST123',
        brand: 'NIKE',
        title: 'NIKE Air Shoe'
      });
    expect(response.body.data).toEqual({
      success: {
        brand: 'NIKE',
        styleId: 'TEST123',
        title: 'NIKE Air Shoe'
      }
    });
  });
  test('should throw error', async () => {
    const response = await request(app)
      .post('/api/v1/workflows/')
      .set('Content-type', 'application/json')
      .send({
        styleId: 'invalid',
        brand: 'NIKE',
        title: 'NIKE Air Shoe'
      });
    expect(response.body.error).toEqual(
      'An error occurred while creating the workflow for invalid.'
    );
  });
});

describe('Testing POST Bulk create workflow', () => {
  test('should return expected response', async () => {
    const response = await request(app)
      .post('/api/v1/workflows/bulk')
      .set('Content-type', 'application/json')
      .send({
        styles: [
          {
            styleId: 'TEST1',
            brand: 'NIKE',
            title: 'NIKE Air Shoe'
          },
          {
            styleId: 'TEST2',
            brand: 'ADIDAS',
            title: 'Shorts'
          },
          {
            styleId: 'TEST3',
            brand: 'Under Armour',
            title: 'T shirt'
          }
        ]
      });
    expect(response.body.data).toEqual({
      data: [
        {
          admin: 'dummyuser',
          brand: 'nike',
          createProcess: 'WRITER_INTERFACE',
          lastUpdatedBy: 'dummyuser',
          styleId: 'TEST1',
          title: 'nike air shoe'
        },
        {
          admin: 'dummyuser',
          brand: 'adidas',
          createProcess: 'WRITER_INTERFACE',
          lastUpdatedBy: 'dummyuser',
          styleId: 'TEST2',
          title: 'shorts'
        },
        {
          admin: 'dummyuser',
          brand: 'under armour',
          createProcess: 'WRITER_INTERFACE',
          lastUpdatedBy: 'dummyuser',
          styleId: 'TEST3',
          title: 't shirt'
        }
      ],
      response: {}
    });
  });
});

describe('Testing POST search workflow', () => {
  test('should return expected response', async () => {
    const response = await request(app)
      .post('/api/v1/workflows/search?page=1&limit=10')
      .set('Content-type', 'application/json')
      .send({
        filters: {
          status: ['ASSIGNED_TO_WRITER', 'ASSIGNED_TO_EDITOR']
        }
      });
    expect(response.body).toEqual({
      data: {
        pagination: { currentPage: 1, currentPageCount: 3, pageCount: 13, total: 124 },
        workflows: [
          { assignee: 'pc.writer@backcountry.com', id: 1234, status: 'ASSIGNED_TO_WRITER' },
          { assignee: 'pc.writer@backcountry.com', id: 3456, status: 'ASSIGNED_TO_WRITER' },
          { assignee: 'pc.writer@backcountry.com', id: 5678, status: 'ASSIGNED_TO_EDITOR' }
        ]
      },
      success: true
    });
  });
  test('should return expected response', async () => {
    const response = await request(app)
      .post('/api/v1/workflows/search?page=1&limit=10&unique=id')
      .set('Content-type', 'application/json')
      .send({
        filters: {
          status: ['ASSIGNED_TO_WRITER', 'ASSIGNED_TO_EDITOR']
        }
      });
    expect(response.body).toEqual({
      data: {
        pagination: { currentPage: 1, currentPageCount: 3, pageCount: 1, total: 3 },
        uniqueValues: [1234, 3456, 5678]
      },
      success: true
    });
  });
});

describe('Testing PATCH save workflow', () => {
  test('should return expected response', async () => {
    const response = await request(app)
      .patch('/api/v1/workflows/WORKFLOW_ID')
      .set('Content-type', 'application/json')
      .send({
        isPublished: true,
        isQuickFix: true
      });
    expect(response.body).toEqual({
      data: {
        changeLog: {
          isPublished: { newValue: true, oldValue: null },
          isQuickFix: true,
          lastUpdatedBy: 'dummyuser'
        },
        createdBy: 'dummyUser',
        isPublished: true,
        isQuickFix: true,
        workflowId: 'WORKFLOW_ID'
      },
      success: true
    });
  });
  test('should throw error', async () => {
    const response = await request(app)
      .patch('/api/v1/workflows/INVALID_WORKFLOW_ID')
      .set('Content-type', 'application/json')
      .send({
        isPublished: true,
        isQuickFix: true
      });
    expect(response.body.error).toEqual('An error occurred while saving workflow for undefined');
  });
  test('should throw error', async () => {
    const response = await request(app)
      .patch('/api/v1/workflows/MISSING_WORKFLOW_ID')
      .set('Content-type', 'application/json')
      .send({
        isPublished: true,
        isQuickFix: true
      });
    expect(response.body.error).toEqual('An error occurred while saving workflow for undefined');
  });
  test('should throw error', async () => {
    const response = await request(app)
      .patch('/api/v1/workflows/WRONG_WORKFLOW_ID')
      .set('Content-type', 'application/json')
      .send({
        isPublished: true,
        isQuickFix: true
      });
    expect(response.body.error).toEqual('An error occurred while saving workflow for undefined');
  });
});

describe('Testing GET workflow', () => {
  test('should return expected response', async () => {
    const response = await request(app).get('/api/v1/workflows/SAMPLE_WORKFLOW_ID');
    expect(response.body).toEqual({
      data: {
        workflow: {
          id: 'SAMPLE_WORKFLOW_ID'
        },
        workflowDeatils: {}
      },
      success: true
    });
  });
  test('should return error response', async () => {
    const response = await request(app).get('/api/v1/workflows/invalid');
    expect(response.body.error).toEqual('Error occured while retrieving a workflow for invalid');
  });
});
