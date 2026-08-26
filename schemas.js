export const schemas = {
  Error: {
    $id: 'Error',

    type: 'object',

    properties: {
      message: {
        type: 'string',
      },
    },

    required: ['message'],
  },

  CreateUser: {
    $id: 'CreateUser',

    type: 'object',

    required: [
      'username',
    ],

    properties: {
      username: {
        type: 'string',
        minLength: 3,
      },
    },
  },

  UserResponse: {
    $id: 'UserResponse',

    type: 'object',

    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },

      username: {
        type: 'string',
      },

      role: {
        type: 'string',
        enum: ['admin', 'user'],
      },
    },

    required: [
      'id',
      'username',
    ],
  },

  UserWithStats: {
    $id: 'UserWithStats',

    type: 'object',

    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },

      username: {
        type: 'string',
      },

      role: {
        type: 'string',
        enum: ['admin', 'user'],
      },

      created_at: {
        type: 'string',
        format: 'date-time',
      },

      total_todos: {
        type: 'integer',
      },

      completed_todos: {
        type: 'integer',
      },
    },

    required: [
      'id',
      'username',
      'role',
      'total_todos',
      'completed_todos',
    ],
  },

  UpdateRole: {
    $id: 'UpdateRole',

    type: 'object',

    required: ['role'],

    properties: {
      role: {
        type: 'string',
        enum: ['admin', 'user'],
      },
    },
  },

  Login: {
    $id: 'Login',

    type: 'object',

    required: [
      'username',
    ],

    properties: {
      username: {
        type: 'string',
      },
    },
  },

  LoginResponse: {
    $id: 'LoginResponse',

    type: 'object',

    properties: {
      message: {
        type: 'string',
      },
    },

    required: ['message'],
  },

  CreateList: {
    $id: 'CreateList',

    type: 'object',

    required: ['name'],

    properties: {
      name: {
        type: 'string',
        minLength: 1,
      },
    },
  },

  List: {
    $id: 'List',

    type: 'object',

    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },

      name: {
        type: 'string',
      },

      created_at: {
        type: 'string',
        format: 'date-time',
      },
    },
  },

  CreateTodo: {
    $id: 'CreateTodo',

    type: 'object',

    required: ['title'],

    properties: {
      title: {
        type: 'string',
      },

      description: {
        type: 'string',
      },

      completed: {
        type: 'boolean',
        default: false,
      },
    },
  },

  Todo: {
    $id: 'Todo',

    type: 'object',

    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },

      list_id: {
        type: 'string',
        format: 'uuid',
      },

      title: {
        type: 'string',
      },

      description: {
        type: 'string',
      },

      completed: {
        type: 'boolean',
      },

      position: {
        type: 'integer',
      },

      created_at: {
        type: 'string',
        format: 'date-time',
      },
    },
  },

  ReorderTodos: {
    $id: 'ReorderTodos',

    type: 'object',

    required: ['orderedIds'],

    properties: {
      orderedIds: {
        type: 'array',
        minItems: 1,

        items: {
          type: 'string',
          format: 'uuid',
        },
      },
    },
  },

  CreatedResponse: {
    $id: 'CreatedResponse',

    type: 'object',

    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
    },

    required: ['id'],
  },

  MessageResponse: {
    $id: 'MessageResponse',

    type: 'object',

    properties: {
      message: {
        type: 'string',
      },
    },

    required: ['message'],
  },
}