const workflow = {
  styleId: 'CPJ17Y',
  create_ts: {
    $date: '2023-03-28T23:58:18.000Z'
  },
  status: 'WAITING_FOR_WRITER',
  editor_review: true,
  title: 'My product title1',
  brand: 'My Brand1',
  writer: 'The Writer',
  editor: 'The Editor',
  admin: 'The Admin',
  last_write_complete_ts: {
    $date: '2023-03-29T23:58:18.000Z'
  },
  last_edit_complete_ts: {
    $date: '2023-03-30T23:58:18.000Z'
  },
  last_updated_by: 'Andrew Smith',
  last_update_ts: {
    $date: '2023-03-30T23:58:18.000Z'
  },
  create_process: 'WRITER_INTERFACE'
};

// ## workbench_audit ##
const workbenchAudit = {
  genus: 'Climbing accessories',
  species: 'Belay Devices',
  harmonizingData: {
    recommendedUse: ['Ice climbing', 'Mountaineering'],
    ropeDiameter: ['<9.5mm'],
    type: ['Figure 8']
  },
  techspecs: {
    responsibleCollection: 'Value1',
    material: 'Value2'
  },
  productTitle: 'My product title',
  topLine: 'The top line',
  detailedDescription: 'Detailed desc val1',
  listDescription: 'My list of desc',
  bulletPoints: 'bullet points 123',
  sizingChart: 'my sizing chart',
  competitiveCyclistTopline: 'top line 33',
  competitiveCyclistDescription: 'desc 123 1',
  versionReason: 'Editing',
  isPublished: false
};
