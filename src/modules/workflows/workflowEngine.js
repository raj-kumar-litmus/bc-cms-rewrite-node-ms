/* eslint-disable indent */
module.exports = (workflow, nextStatus, updatedFields) => {
  const transitions = {
    WAITING_FOR_WRITER: ['ASSIGNED_TO_WRITER'],
    ASSIGNED_TO_WRITER: ['WRITING_IN_PROGRESS'],
    WRITING_IN_PROGRESS: ['WRITING_COMPLETE'],
    WRITING_COMPLETE: ['ASSIGNED_TO_EDITOR'],
    ASSIGNED_TO_EDITOR: ['EDITING_IN_PROGRESS'],
    EDITING_IN_PROGRESS: ['EDITING_COMPLETE']
  };

  const currentStatus = workflow.status;
  const allowedTransitions = transitions[currentStatus];

  if (nextStatus === currentStatus) {
    throw new Error('Invalid state transition. Same status.');
  }

  if (!allowedTransitions) {
    throw new Error(`Invalid workflow status: ${currentStatus}`);
  }

  if (nextStatus && allowedTransitions.includes(nextStatus)) {
    console.log(`Moving from ${currentStatus} to ${nextStatus}`);

    switch (nextStatus) {
      case 'WAITING_FOR_WRITER':
        // Add any necessary logic for this step
        break;
      case 'ASSIGNED_TO_WRITER':
        if (!updatedFields.writer) {
          throw new Error('No writer assigned to the workflow.');
        }
        break;
      case 'WRITING_IN_PROGRESS':
        // Add any necessary logic for this step
        break;
      case 'WRITING_COMPLETE':
        // Add any necessary logic for this step
        break;
      case 'ASSIGNED_TO_EDITOR':
        if (!updatedFields.editor) {
          throw new Error('No editor assigned to the workflow.');
        }
        break;
      case 'EDITING_IN_PROGRESS':
        // Add any necessary logic for this step
        break;
      case 'EDITING_COMPLETE':
        // Add any necessary logic for this step
        break;
      default:
        throw new Error(`Invalid workflow status: ${nextStatus}`);
    }
  } else {
    throw new Error(
      `Invalid state transition. Requested status: ${nextStatus}`
    );
  }
};
