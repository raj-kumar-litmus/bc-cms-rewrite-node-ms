/* eslint-disable */

const { Status } = require('./enums');

module.exports = (workflow, { writer, editor }) => {
  const transitions = {
    [Status.WAITING_FOR_WRITER]: [Status.ASSIGNED_TO_WRITER],
    [Status.ASSIGNED_TO_WRITER]: [Status.WRITING_IN_PROGRESS],
    [Status.WRITING_IN_PROGRESS]: [
      Status.WRITING_COMPLETE,
      Status.ASSIGNED_TO_WRITER
    ],
    [Status.WRITING_COMPLETE]: [
      Status.ASSIGNED_TO_EDITOR,
      Status.ASSIGNED_TO_WRITER
    ],
    [Status.ASSIGNED_TO_EDITOR]: [
      Status.EDITING_IN_PROGRESS,
      Status.ASSIGNED_TO_WRITER
    ],
    [Status.EDITING_IN_PROGRESS]: [
      Status.EDITING_COMPLETE,
      Status.ASSIGNED_TO_EDITOR,
      Status.ASSIGNED_TO_WRITER
    ]
  };

  const currentStatus = workflow.status;
  const allowedTransitions = transitions[currentStatus];

  if (!allowedTransitions) {
    throw new Error(`Invalid workflow status: ${currentStatus}`);
  }

  let nextStatus;

  console.log(`Moving from ${currentStatus}`);

  switch (currentStatus) {
    case Status.WAITING_FOR_WRITER:
      if (!writer) {
        throw new Error(
          'No writer assigned to the workflow. Cannot proceed to the next step.'
        );
      }
      nextStatus = Status.ASSIGNED_TO_WRITER;
      workflow.writer = writer;
      // Add any necessary logic for this step
      break;
    case Status.ASSIGNED_TO_WRITER:
      if (writer) {
        workflow.writer = writer;
      }
      nextStatus = Status.WRITING_IN_PROGRESS;
      break;
    case Status.WRITING_IN_PROGRESS:
      if (writer) {
        nextStatus = Status.WRITING_COMPLETE;
      } else {
        nextStatus = Status.ASSIGNED_TO_WRITER;
      }
      break;
    case Status.WRITING_COMPLETE:
      if (writer) {
        nextStatus = Status.ASSIGNED_TO_WRITER;
      } else if (editor) {
        nextStatus = Status.ASSIGNED_TO_EDITOR;
      } else {
        throw new Error(
          'Both a writer and an editor are required to proceed to the next step.'
        );
      }
      break;
    case Status.ASSIGNED_TO_EDITOR:
      if (!editor) {
        throw new Error(
          'No editor assigned to the workflow. Cannot proceed to the next step.'
        );
      }
      nextStatus = Status.EDITING_IN_PROGRESS;
      break;
    case Status.EDITING_IN_PROGRESS:
      nextStatus = Status.EDITING_COMPLETE;
      // Add any necessary logic for this step
      break;
    default:
      throw new Error(`Invalid workflow status: ${currentStatus}`);
  }

  console.log(`Moving to ${nextStatus}`);
  workflow.status = nextStatus;
};
