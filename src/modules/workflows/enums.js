const CreateProcess = Object.freeze({
  TOPIC: 'TOPIC',
  WRITER_INTERFACE: 'WRITER_INTERFACE'
});

const WorkflowKeysEnum = {
  id: 'id',
  admin: 'admin',
  brand: 'brand',
  createProcess: 'createProcess',
  createTs: 'createTs',
  editor: 'editor',
  editorReview: 'editorReview',
  lastEditCompleteTs: 'lastEditCompleteTs',
  lastUpdateTs: 'lastUpdateTs',
  lastUpdatedBy: 'lastUpdatedBy',
  lastWriteCompleteTs: 'lastWriteCompleteTs',
  status: 'status',
  styleId: 'styleId',
  title: 'title',
  writer: 'writer',
  assignee: 'assignee'
};

const WorkflowAuditLogKeysEnum = {
  id: 'id',
  assignee: 'assignee',
  bulletPoints: 'bulletPoints',
  competitiveCyclistDescription: 'competitiveCyclistDescription',
  competitiveCyclistTopline: 'competitiveCyclistTopline',
  detailedDescription: 'detailedDescription',
  genus: 'genus',
  harmonizingData: 'harmonizingData',
  isPublished: 'isPublished',
  listDescription: 'listDescription',
  productTitle: 'productTitle',
  sizingChart: 'sizingChart',
  species: 'species',
  status: 'status',
  techspecs: 'techspecs',
  topLine: 'topLine',
  versionReason: 'versionReason',
  createTs: 'createTs',
  createdBy: 'createdBy',
  workflowId: 'workflowId',
  lastEditCompleteTs: 'lastEditCompleteTs',
  lastWriteCompleteTs: 'lastWriteCompleteTs',
  editor: 'editor',
  writer: 'writer'
};

const Status = Object.freeze({
  WAITING_FOR_WRITER: 'WAITING_FOR_WRITER',
  ASSIGNED_TO_WRITER: 'ASSIGNED_TO_WRITER',
  WRITING_IN_PROGRESS: 'WRITING_IN_PROGRESS',
  WRITING_COMPLETE: 'WRITING_COMPLETE',
  ASSIGNED_TO_EDITOR: 'ASSIGNED_TO_EDITOR',
  EDITING_IN_PROGRESS: 'EDITING_IN_PROGRESS',
  EDITING_COMPLETE: 'EDITING_COMPLETE'
});

module.exports = {
  CreateProcess,
  Status,
  WorkflowKeysEnum,
  WorkflowAuditLogKeysEnum
};
