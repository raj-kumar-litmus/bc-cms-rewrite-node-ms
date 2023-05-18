/* eslint-disable indent */
const { Status, WorkflowKeysEnum } = require('./enums');

module.exports = (workflow, { writer, editor }) => {
  const currentStatus = workflow.status;
  const changeLog = {};

  switch (currentStatus) {
    case Status.WAITING_FOR_WRITER:
      if (!writer) {
        throw new Error('A writer must be provided to proceed to the next step.');
      }
      changeLog[WorkflowKeysEnum.writer] = writer;
      changeLog[WorkflowKeysEnum.status] = Status.ASSIGNED_TO_WRITER;
      break;

    case Status.ASSIGNED_TO_WRITER:
      if (writer) {
        changeLog[WorkflowKeysEnum.writer] = writer;
      } else {
        changeLog[WorkflowKeysEnum.status] = Status.WRITING_IN_PROGRESS;
      }
      break;

    case Status.WRITING_IN_PROGRESS:
      if (writer) {
        changeLog[WorkflowKeysEnum.writer] = writer;
        changeLog[WorkflowKeysEnum.status] = Status.ASSIGNED_TO_WRITER;
      } else {
        changeLog[WorkflowKeysEnum.status] = Status.WRITING_COMPLETE;
        changeLog[WorkflowKeysEnum.lastWriteCompleteTs] = new Date();
      }
      break;

    case Status.WRITING_COMPLETE:
      if (writer) {
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
      if (editor) {
        changeLog[WorkflowKeysEnum.editor] = editor;
      } else {
        changeLog[WorkflowKeysEnum.status] = Status.EDITING_IN_PROGRESS;
      }
      break;

    case Status.EDITING_IN_PROGRESS:
      if (editor) {
        changeLog[WorkflowKeysEnum.editor] = editor;
        changeLog[WorkflowKeysEnum.status] = Status.ASSIGNED_TO_EDITOR;
      } else {
        changeLog[WorkflowKeysEnum.status] = Status.EDITING_COMPLETE;
        changeLog[WorkflowKeysEnum.lastEditCompleteTs] = new Date();
      }
      break;

    case Status.EDITING_COMPLETE:
      if (editor) {
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

  console.log(
    `Moving workflow ${workflow.id} from ${currentStatus} to ${
      changeLog[WorkflowKeysEnum.status] || currentStatus
    }`,
    changeLog
  );

  return changeLog;
};
