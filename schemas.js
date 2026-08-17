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
      'password',
    ],

    properties: {
      username: {
        type: 'string',
        minLength: 3,
      },

      password: {
        type: 'string',
        minLength: 6,
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

  Login: {
    $id: 'Login',

    type: 'object',

    required: [
      'username',
      'password',
    ],

    properties: {
      username: {
        type: 'string',
      },

      password: {
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

      user_id: {
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

      created_at: {
        type: 'string',
        format: 'date-time',
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
