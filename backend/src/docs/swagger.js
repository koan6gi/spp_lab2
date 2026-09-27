const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Minimalist Notes API',
    version: '2.0.0',
    description: 'REST API for Minimalist Notes with Role-Based Access Control, session management, brute-force protection, and file uploads.',
  },
  servers: [
    {
      url: '/',
      description: 'Current server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string' },
          details: { type: 'array', items: { type: 'string' } },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['user', 'moderator', 'admin'] },
        },
      },
      Note: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          text: { type: 'string', nullable: true },
          image_url: { type: 'string', nullable: true },
          user_id: { type: 'string', format: 'uuid' },
          author_email: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Session: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_agent: { type: 'string' },
          ip_address: { type: 'string' },
          last_active_at: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' },
          isCurrent: { type: 'boolean' },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User created' },
          409: { description: 'Email already exists' },
          422: { description: 'Validation failure' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        summary: 'Log in with credentials',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
          403: { description: 'Account suspended' },
          429: { description: 'Account locked / Too many requests' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'New access token issued' },
          401: { description: 'Invalid or expired session' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        summary: 'Get current user profile',
        tags: ['Auth'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Current user data' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/auth/sessions': {
      get: {
        summary: 'List active sessions for current user',
        tags: ['Sessions'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Active sessions array' },
        },
      },
      delete: {
        summary: 'Revoke all other active sessions',
        tags: ['Sessions'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Sessions revoked' },
        },
      },
    },
    '/api/auth/sessions/{id}': {
      delete: {
        summary: 'Revoke specific session',
        tags: ['Sessions'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Session revoked' },
          404: { description: 'Session not found' },
        },
      },
    },
    '/api/auth/forgot-password': {
      post: {
        summary: 'Request password reset email',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Reset link dispatched' },
        },
      },
    },
    '/api/auth/reset-password': {
      post: {
        summary: 'Reset password using token',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'newPassword'],
                properties: {
                  token: { type: 'string' },
                  newPassword: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset successful' },
          400: { description: 'Invalid or expired token' },
        },
      },
    },
    '/api/notes': {
      get: {
        summary: 'Fetch notes (personal for user, all for moderator/admin)',
        tags: ['Notes'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Notes list' },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create note',
        tags: ['Notes'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string' },
                  text: { type: 'string' },
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string' },
                  text: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Note created' },
          400: { description: 'Validation error' },
          413: { description: 'File over 20 MB' },
        },
      },
    },
    '/api/notes/{id}': {
      put: {
        summary: 'Update note (entire form state)',
        tags: ['Notes'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'Note updated' },
          403: { description: 'Forbidden' },
          404: { description: 'Note not found' },
        },
      },
      delete: {
        summary: 'Delete note',
        tags: ['Notes'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          204: { description: 'Note deleted' },
          403: { description: 'Forbidden' },
          404: { description: 'Note not found' },
        },
      },
    },
    '/api/users': {
      get: {
        summary: 'List users (Admin only)',
        tags: ['Admin'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Users list' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/api/users/{id}/role': {
      put: {
        summary: 'Change user role (Admin only)',
        tags: ['Admin'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: { role: { type: 'string', enum: ['user', 'moderator', 'admin'] } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Role updated' },
        },
      },
    },
    '/api/users/{id}/block': {
      put: {
        summary: 'Toggle user block status (Admin only)',
        tags: ['Admin'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          200: { description: 'User block status toggled' },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
