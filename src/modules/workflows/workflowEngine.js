/* eslint-disable indent */
const { Status, WorkflowKeysEnum } = require('./enums');

module.exports = (workflow, { writer, editor, isPublished }) => {
  const currentStatus = workflow.status;
  const changeLog = {};

  switch (currentStatus) {
    case Status.WAITING_FOR_WRITER:
      if (editor) {
        throw new Error('Editor assignment is not allowed at this stage of the workflow.');
      } else if (writer) {
        changeLog[WorkflowKeysEnum.writer] = writer;
        changeLog[WorkflowKeysEnum.status] = Status.ASSIGNED_TO_WRITER;
      } else {
        throw new Error('A writer must be provided to proceed to the next step.');
      }
      break;

    case Status.ASSIGNED_TO_WRITER:
      if (editor) {
        throw new Error('Editor assignment is not allowed at this stage of the workflow.');
      } else if (writer) {
        changeLog[WorkflowKeysEnum.writer] = writer;
      } else if (isPublished) {
        changeLog[WorkflowKeysEnum.status] = Status.WRITING_COMPLETE;
        changeLog[WorkflowKeysEnum.lastWriteCompleteTs] = new Date();
        changeLog[WorkflowKeysEnum.isPublished] = true;
      } else {
        changeLog[WorkflowKeysEnum.status] = Status.WRITING_IN_PROGRESS;
      }
      break;

    case Status.WRITING_IN_PROGRESS:
      if (editor) {
        throw new Error('Editor assignment is not allowed at this stage of the workflow.');
      } else if (writer) {
        changeLog[WorkflowKeysEnum.writer] = writer;
      } else if (isPublished) {
        changeLog[WorkflowKeysEnum.status] = Status.WRITING_COMPLETE;
        changeLog[WorkflowKeysEnum.lastWriteCompleteTs] = new Date();
        changeLog[WorkflowKeysEnum.isPublished] = true;
      }
      break;

    case Status.WRITING_COMPLETE:
      if (writer && editor) {
        throw new Error(
          'Either writer or editor should only be provided to proceed to the next step.'
        );
      } else if (writer) {
        changeLog[WorkflowKeysEnum.writer] = writer;
        changeLog[WorkflowKeysEnum.status] = Status.ASSIGNED_TO_WRITER;
      } else if (editor) {
        changeLog[WorkflowKeysEnum.editor] = editor;
        changeLog[WorkflowKeysEnum.status] = Status.ASSIGNED_TO_EDITOR;
      } else {
        throw new Error('A writer or editor must be provided to proceed to the next step.');
      }
      break;

    case Status.ASSIGNED_TO_EDITOR:
      if (writer) {
        throw new Error('Writer assignment is not allowed at this stage of the workflow.');
      } else if (editor) {
        changeLog[WorkflowKeysEnum.editor] = editor;
      } else if (isPublished) {
        changeLog[WorkflowKeysEnum.status] = Status.EDITING_COMPLETE;
        changeLog[WorkflowKeysEnum.lastEditCompleteTs] = new Date();
        changeLog[WorkflowKeysEnum.isPublished] = true;
      } else {
        changeLog[WorkflowKeysEnum.status] = Status.EDITING_IN_PROGRESS;
      }
      break;

    case Status.EDITING_IN_PROGRESS:
      if (writer) {
        throw new Error('Writer assignment is not allowed at this stage of the workflow.');
      } else if (editor) {
        changeLog[WorkflowKeysEnum.editor] = editor;
      } else if (isPublished) {
        changeLog[WorkflowKeysEnum.status] = Status.EDITING_COMPLETE;
        changeLog[WorkflowKeysEnum.lastEditCompleteTs] = new Date();
        changeLog[WorkflowKeysEnum.isPublished] = true;
      }
      break;

    case Status.EDITING_COMPLETE:
      if (writer && editor) {
        throw new Error(
          'Either writer or editor should only be provided to proceed to the next step.'
        );
      } else if (editor) {
        changeLog[WorkflowKeysEnum.editor] = editor;
        changeLog[WorkflowKeysEnum.status] = Status.ASSIGNED_TO_EDITOR;
      } else if (writer) {
        changeLog[WorkflowKeysEnum.writer] = writer;
        changeLog[WorkflowKeysEnum.status] = Status.ASSIGNED_TO_WRITER;
      } else {
        throw new Error('A writer or editor must be provided to proceed to the next step.');
      }
      break;

    default:
      break;
  }

  if (changeLog[WorkflowKeysEnum.writer]) {
    changeLog[WorkflowKeysEnum.assignee] = changeLog[WorkflowKeysEnum.writer];
  } else if (changeLog[WorkflowKeysEnum.editor]) {
    changeLog[WorkflowKeysEnum.assignee] = changeLog[WorkflowKeysEnum.editor];
  }

  return changeLog;
};
