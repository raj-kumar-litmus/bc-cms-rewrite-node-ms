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
  writer: 'writer'
};

const Status = Object.freeze({
  WAITING_FOR_WRITER: 'WAITING_FOR_WRITER',
  ASSIGNED_TO_WRITER: 'ASSIGNED_TO_WRITER',
  WRITING_IN_PROGRESS: 'WRITING_IN_PROGRESS',
  WRITING_COMPLETE: 'WRITING_COMPLETE',
  ASSIDNED_TO_EDITOR: 'ASSIDNED_TO_EDITOR',
  EDITING_IN_PROGRESS: 'EDITING_IN_PROGRESS',
  EDITING_COMPLETE: 'EDITING_COMPLETE'
});

module.exports = {
  CreateProcess,
  Status,
  WorkflowKeysEnum
};
