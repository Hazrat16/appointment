/**
 * Hand-written OpenAPI 3.0 spec. Kept in sync manually with routes/*.ts —
 * express-validator rules there are the source of truth for request bodies.
 */

const ApiResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
  },
};

const ValidationErrorResponse = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string', example: 'Validation failed' },
    errors: { type: 'array', items: { type: 'object' } },
  },
};

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Doctor Appointment API',
    version: '1.0.0',
    description: 'REST API for the doctor appointment booking platform.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiResponse,
      ValidationErrorResponse,
    },
    responses: {
      ValidationError: {
        description: 'Validation failed',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationErrorResponse' } } },
      },
      Unauthorized: {
        description: 'Missing or invalid auth token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth' },
    { name: 'Doctors' },
    { name: 'Appointments' },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new patient, doctor, or admin account',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstName', 'lastName', 'email', 'password', 'phone', 'dateOfBirth', 'gender'],
                properties: {
                  firstName: { type: 'string', maxLength: 50 },
                  lastName: { type: 'string', maxLength: 50 },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  phone: { type: 'string' },
                  dateOfBirth: { type: 'string', format: 'date' },
                  gender: { type: 'string', enum: ['male', 'female', 'other'] },
                  role: { type: 'string', enum: ['patient', 'doctor', 'admin'] },
                  specialization: { type: 'string', description: 'Required when role=doctor' },
                  licenseNumber: { type: 'string', description: 'Required when role=doctor' },
                  experience: { type: 'integer', minimum: 0, description: 'Required when role=doctor' },
                  consultationFee: { type: 'number', minimum: 0, description: 'Required when role=doctor' },
                  education: {
                    type: 'array',
                    description: 'Required when role=doctor',
                    items: {
                      type: 'object',
                      properties: {
                        degree: { type: 'string' },
                        institution: { type: 'string' },
                        year: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Account created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and receive a JWT',
        security: [],
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
          '200': { description: 'Logged in', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get the current authenticated user',
        responses: {
          '200': { description: 'Current user', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/profile': {
      put: {
        tags: ['Auth'],
        summary: "Update the current user's profile",
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string', maxLength: 50 },
                  lastName: { type: 'string', maxLength: 50 },
                  phone: { type: 'string' },
                  dateOfBirth: { type: 'string', format: 'date' },
                  gender: { type: 'string', enum: ['male', 'female', 'other'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/change-password': {
      put: {
        tags: ['Auth'],
        summary: "Change the current user's password",
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password changed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/doctors': {
      get: {
        tags: ['Doctors'],
        summary: 'List verified doctors',
        security: [],
        parameters: [
          { name: 'specialization', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'List of doctors', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/doctors/{id}': {
      get: {
        tags: ['Doctors'],
        summary: 'Get a doctor profile by id',
        security: [],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Doctor profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/doctors/{id}/availability': {
      get: {
        tags: ['Doctors'],
        summary: 'Get a doctor\'s open slots for a given date',
        security: [],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'date', in: 'query', required: true, schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': { description: 'Available slots', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
    },
    '/doctors/availability': {
      put: {
        tags: ['Doctors'],
        summary: 'Set the current doctor\'s weekly availability',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['availability'],
                properties: {
                  availability: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        dayOfWeek: { type: 'integer', minimum: 0, maximum: 6 },
                        startTime: { type: 'string', example: '09:00' },
                        endTime: { type: 'string', example: '17:00' },
                        slotDuration: { type: 'integer', minimum: 15, maximum: 120 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Availability updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/doctors/dashboard': {
      get: {
        tags: ['Doctors'],
        summary: "Get the current doctor's dashboard stats",
        responses: {
          '200': { description: 'Dashboard data', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/doctors/admin/all': {
      get: {
        tags: ['Doctors'],
        summary: 'Admin: list all doctors (any verification status)',
        parameters: [
          { name: 'verificationStatus', in: 'query', schema: { type: 'boolean' } },
          { name: 'specialization', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'List of doctors', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/doctors/admin/{id}/verify': {
      put: {
        tags: ['Doctors'],
        summary: 'Admin: set a doctor\'s verification status',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['isVerified'],
                properties: { isVerified: { type: 'boolean' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Verification updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/doctors/admin/stats': {
      get: {
        tags: ['Doctors'],
        summary: 'Admin: doctor-related platform stats',
        responses: {
          '200': { description: 'Stats', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/appointments': {
      get: {
        tags: ['Appointments'],
        summary: "List the current user's appointments",
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'List of appointments', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Appointments'],
        summary: 'Book a new appointment (patient only)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['doctorId', 'appointmentDate', 'startTime', 'endTime'],
                properties: {
                  doctorId: { type: 'string' },
                  appointmentDate: { type: 'string', format: 'date' },
                  startTime: { type: 'string', example: '09:00' },
                  endTime: { type: 'string', example: '09:30' },
                  symptoms: { type: 'string', maxLength: 1000 },
                  notes: { type: 'string', maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Appointment created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/appointments/{id}': {
      get: {
        tags: ['Appointments'],
        summary: 'Get a single appointment by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Appointment', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '404': { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
        },
      },
      put: {
        tags: ['Appointments'],
        summary: 'Update an appointment (status, notes, prescription, diagnosis, follow-up)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'] },
                  prescription: { type: 'string', maxLength: 2000 },
                  diagnosis: { type: 'string', maxLength: 1000 },
                  followUpRequired: { type: 'boolean' },
                  followUpDate: { type: 'string', format: 'date' },
                  notes: { type: 'string', maxLength: 500 },
                  symptoms: { type: 'string', maxLength: 1000 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Appointment updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      delete: {
        tags: ['Appointments'],
        summary: 'Cancel an appointment',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { cancellationReason: { type: 'string', maxLength: 500 } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Appointment cancelled', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  },
};
