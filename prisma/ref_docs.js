const workflow = {
  style_id: 'CPJ17Y',
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
  workflow_id: 155,
  style_id: 'CPJ17Y',
  genus: 'Climbing accessories',
  species: 'Belay Devices',
  harmonizing_data: {
    'Recommended Use': ['Ice climbing', 'Mountaineering'],
    'Rope Diameter': ['<9.5mm'],
    Type: ['Figure 8']
  },
  techspecs: {
    'Responsible Collection': 'Value1',
    Material: 'Value2'
  },
  assignee: 'Sam Thomas',
  version_ts: {
    $date: '2020-10-28T23:58:18.000Z'
  },
  product_title: 'My product title',
  top_line: 'The top line',
  detailed_description: 'Detailed desc val1',
  list_description: 'My list of desc',
  bullet_points: 'bullet points 123',
  sizing_chart: 'my sizing chart',
  competitive_cyclist_topline: 'top line 33',
  competitive_cyclist_description: 'desc 123 1',
  version_reason: 'Editing',
  status: 'WAITING_FOR_WRITER',
  is_published: false
};
