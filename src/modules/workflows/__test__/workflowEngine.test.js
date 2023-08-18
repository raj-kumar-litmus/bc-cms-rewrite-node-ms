const workflowEngine = require('../workflowEngine');

describe('Testing workflowengine', () => {
  beforeAll(() => {
    jest.useFakeTimers('modern');
    jest.setSystemTime(new Date(2020, 3, 1));
  });
  afterAll(() => {
    jest.useRealTimers();
  });
  describe('For status WAITING_FOR_WRITER', () => {
    test('returns expected response for status WAITING_FOR_WRITER', () => {
      expect(
        workflowEngine(
          {
            status: 'WAITING_FOR_WRITER'
          },
          {
            writer: 'pc.writer@backcountry.com'
          }
        )
      ).toEqual({
        assignee: 'pc.writer@backcountry.com',
        status: 'ASSIGNED_TO_WRITER',
        writer: 'pc.writer@backcountry.com'
      });
    });
    test('throw error for status WAITING_FOR_WRITER', () => {
      try {
        workflowEngine(
          {
            status: 'WAITING_FOR_WRITER'
          },
          {
            editor: 'pc.editor@backcountry.com'
          }
        );
      } catch (err) {
        expect(err.message).toEqual(
          'Editor assignment is not allowed at this stage of the workflow.'
        );
      }
    });
    test('throw error status WAITING_FOR_WRITER', () => {
      try {
        workflowEngine(
          {
            status: 'WAITING_FOR_WRITER'
          },
          {}
        );
      } catch (err) {
        expect(err.message).toEqual('A writer must be provided to proceed to the next step.');
      }
    });
  });
  describe('For status ASSIGNED_TO_WRITER', () => {
    test('returns expected response for status ASSIGNED_TO_WRITER', () => {
      expect(
        workflowEngine(
          {
            status: 'ASSIGNED_TO_WRITER'
          },
          {
            writer: 'pc.writer@backcountry.com'
          }
        )
      ).toEqual({ assignee: 'pc.writer@backcountry.com', writer: 'pc.writer@backcountry.com' });
    });
    test('throw error for status ASSIGNED_TO_WRITER', () => {
      try {
        workflowEngine(
          {
            status: 'ASSIGNED_TO_WRITER'
          },
          {
            editor: 'pc.editor@backcountry.com'
          }
        );
      } catch (err) {
        expect(err.message).toEqual(
          'Editor assignment is not allowed at this stage of the workflow.'
        );
      }
    });
    test('throw error status ASSIGNED_TO_WRITER', () => {
      expect(
        workflowEngine(
          {
            status: 'ASSIGNED_TO_WRITER'
          },
          {}
        )
      ).toEqual({ status: 'WRITING_IN_PROGRESS' });
    });
    test('throw error status ASSIGNED_TO_WRITER', () => {
      expect(
        workflowEngine(
          {
            status: 'ASSIGNED_TO_WRITER'
          },
          { isPublished: true }
        )
      ).toEqual({
        isPublished: true,
        lastWriteCompleteTs: new Date(2020, 3, 1),
        status: 'WRITING_COMPLETE'
      });
    });
  });
  describe('For status WRITING_IN_PROGRESS', () => {
    test('returns expected response for status WRITING_IN_PROGRESS', () => {
      expect(
        workflowEngine(
          {
            status: 'WRITING_IN_PROGRESS'
          },
          {
            writer: 'pc.writer@backcountry.com'
          }
        )
      ).toEqual({ assignee: 'pc.writer@backcountry.com', writer: 'pc.writer@backcountry.com' });
    });
    test('throw error for status WRITING_IN_PROGRESS', () => {
      try {
        workflowEngine(
          {
            status: 'WRITING_IN_PROGRESS'
          },
          {
            editor: 'pc.editor@backcountry.com'
          }
        );
      } catch (err) {
        expect(err.message).toEqual(
          'Editor assignment is not allowed at this stage of the workflow.'
        );
      }
    });
    test('throw error status WRITING_IN_PROGRESS', () => {
      expect(
        workflowEngine(
          {
            status: 'WRITING_IN_PROGRESS'
          },
          {}
        )
      ).toEqual({});
    });
    test('throw error status WRITING_IN_PROGRESS', () => {
      expect(
        workflowEngine(
          {
            status: 'WRITING_IN_PROGRESS'
          },
          { isPublished: true }
        )
      ).toEqual({
        isPublished: true,
        lastWriteCompleteTs: new Date(2020, 3, 1),
        status: 'WRITING_COMPLETE'
      });
    });
  });
  describe('For status WRITING_COMPLETE', () => {
    test('returns expected response for status WRITING_COMPLETE', () => {
      expect(
        workflowEngine(
          {
            status: 'WRITING_COMPLETE'
          },
          {
            writer: 'pc.writer@backcountry.com'
          }
        )
      ).toEqual({
        assignee: 'pc.writer@backcountry.com',
        status: 'ASSIGNED_TO_WRITER',
        writer: 'pc.writer@backcountry.com'
      });
    });
    test('returns expected response for status WRITING_COMPLETE', () => {
      expect(
        workflowEngine(
          {
            status: 'WRITING_COMPLETE'
          },
          {
            editor: 'pc.editor@backcountry.com'
          }
        )
      ).toEqual({
        assignee: 'pc.editor@backcountry.com',
        status: 'ASSIGNED_TO_EDITOR',
        editor: 'pc.editor@backcountry.com'
      });
    });
    test('throw error for status WRITING_COMPLETE', () => {
      try {
        workflowEngine(
          {
            status: 'WRITING_COMPLETE'
          },
          {
            editor: 'pc.editor@backcountry.com',
            writer: 'pc.writer@backcountry.com'
          }
        );
      } catch (err) {
        expect(err.message).toEqual(
          'Either writer or editor should only be provided to proceed to the next step.'
        );
      }
    });
    test('throw error for status WRITING_COMPLETE', () => {
      try {
        workflowEngine(
          {
            status: 'WRITING_COMPLETE'
          },
          {}
        );
      } catch (err) {
        expect(err.message).toEqual(
          'A writer or editor must be provided to proceed to the next step.'
        );
      }
    });
  });
  describe('For status ASSIGNED_TO_EDITOR', () => {
    test('returns expected response for status ASSIGNED_TO_EDITOR', () => {
      expect(
        workflowEngine(
          {
            status: 'ASSIGNED_TO_EDITOR'
          },
          {
            editor: 'pc.editor@backcountry.com'
          }
        )
      ).toEqual({
        assignee: 'pc.editor@backcountry.com',
        editor: 'pc.editor@backcountry.com'
      });
    });
    test('returns expected response for status ASSIGNED_TO_EDITOR', () => {
      expect(
        workflowEngine(
          {
            status: 'ASSIGNED_TO_EDITOR'
          },
          {
            isPublished: true
          }
        )
      ).toEqual({
        isPublished: true,
        lastEditCompleteTs: new Date(2020, 3, 1),
        status: 'EDITING_COMPLETE'
      });
    });
    test('returns expected response for status ASSIGNED_TO_EDITOR', () => {
      expect(
        workflowEngine(
          {
            status: 'ASSIGNED_TO_EDITOR'
          },
          {}
        )
      ).toEqual({
        status: 'EDITING_IN_PROGRESS'
      });
    });
    test('throw error for status ASSIGNED_TO_EDITOR', () => {
      try {
        workflowEngine(
          {
            status: 'ASSIGNED_TO_EDITOR'
          },
          {
            writer: 'pc.writer@backcountry.com'
          }
        );
      } catch (err) {
        expect(err.message).toEqual(
          'Writer assignment is not allowed at this stage of the workflow.'
        );
      }
    });
  });
  describe('For status EDITING_IN_PROGRESS', () => {
    test('returns expected response for status EDITING_IN_PROGRESS', () => {
      expect(
        workflowEngine(
          {
            status: 'EDITING_IN_PROGRESS'
          },
          {
            editor: 'pc.editor@backcountry.com'
          }
        )
      ).toEqual({ assignee: 'pc.editor@backcountry.com', editor: 'pc.editor@backcountry.com' });
    });
    test('returns expected response for status EDITING_IN_PROGRESS', () => {
      expect(
        workflowEngine(
          {
            status: 'EDITING_IN_PROGRESS'
          },
          {
            isPublished: true
          }
        )
      ).toEqual({
        isPublished: true,
        lastEditCompleteTs: new Date(2020, 3, 1),
        status: 'EDITING_COMPLETE'
      });
    });
    test('throw error for status EDITING_IN_PROGRESS', () => {
      try {
        workflowEngine(
          {
            status: 'EDITING_IN_PROGRESS'
          },
          {
            writer: 'pc.writer@backcountry.com'
          }
        );
      } catch (err) {
        expect(err.message).toEqual(
          'Writer assignment is not allowed at this stage of the workflow.'
        );
      }
    });
  });
  describe('For status EDITING_COMPLETE', () => {
    test('returns expected response for status EDITING_COMPLETE', () => {
      expect(
        workflowEngine(
          {
            status: 'EDITING_COMPLETE'
          },
          {
            editor: 'pc.editor@backcountry.com'
          }
        )
      ).toEqual({
        assignee: 'pc.editor@backcountry.com',
        editor: 'pc.editor@backcountry.com',
        status: 'ASSIGNED_TO_EDITOR'
      });
    });
    test('returns expected response for status EDITING_COMPLETE', () => {
      expect(
        workflowEngine(
          {
            status: 'EDITING_COMPLETE'
          },
          {
            writer: 'pc.writer@backcountry.com'
          }
        )
      ).toEqual({
        assignee: 'pc.writer@backcountry.com',
        status: 'ASSIGNED_TO_WRITER',
        writer: 'pc.writer@backcountry.com'
      });
    });
    test('throw error for status EDITING_COMPLETE', () => {
      try {
        workflowEngine(
          {
            status: 'EDITING_COMPLETE'
          },
          {
            writer: 'pc.writer@backcountry.com',
            editor: 'pc.editor@backcountry.com'
          }
        );
      } catch (err) {
        expect(err.message).toEqual(
          'Either writer or editor should only be provided to proceed to the next step.'
        );
      }
    });
    test('throw error for status EDITING_COMPLETE', () => {
      try {
        workflowEngine(
          {
            status: 'EDITING_COMPLETE'
          },
          {}
        );
      } catch (err) {
        expect(err.message).toEqual(
          'A writer or editor must be provided to proceed to the next step.'
        );
      }
    });
  });
  describe('For invalid staus', () => {
    test('returns expected response', () => {
      expect(
        workflowEngine(
          {
            status: 'HELLO_WORLD'
          },
          {
            editor: 'pc.editor@backcountry.com'
          }
        )
      ).toEqual({});
    });
  });
});
