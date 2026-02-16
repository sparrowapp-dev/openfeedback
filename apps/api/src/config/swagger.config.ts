import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { config } from './index.js';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'OpenFeedback API',
    version: '1.0.0',
    description: `
OpenFeedback is a self-hosted, Canny.io-compatible feedback collection platform.

## Authentication

All API endpoints (except company creation and auth routes) require API key authentication.
Include your API key in the request body:

\`\`\`json
{
  "apiKey": "your_api_key_here",
  ...other parameters
}
\`\`\`

## Canny Compatibility

This API is designed to be 100% compatible with Canny.io's API. All endpoints use POST method
with JSON body parameters, matching Canny's API design.

## Response Format

All responses follow a consistent format:
- Success: Returns the requested data directly
- Error: Returns \`{ "error": "error message" }\` with appropriate HTTP status code
    `,
    contact: {
      name: 'OpenFeedback',
      url: 'https://github.com/openfeedback/openfeedback',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/api/v1`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      apiKey: {
        type: 'apiKey',
        in: 'body',
        name: 'apiKey',
        description: 'API key passed in request body',
      },
    },
    schemas: {
      // Common schemas
      ObjectId: {
        type: 'string',
        pattern: '^[a-f\\d]{24}$',
        example: '507f1f77bcf86cd799439011',
        description: 'MongoDB ObjectID',
      },
      Timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-15T10:30:00.000Z',
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            example: 'error message',
          },
        },
      },
      
      // Board schemas
      Board: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/ObjectId' },
          name: { type: 'string', example: 'Feature Requests' },
          isPrivate: { type: 'boolean', default: false },
          privateComments: { type: 'boolean', default: false },
          postCount: { type: 'number', example: 42 },
          url: { type: 'string', example: 'https://feedback.example.com/boards/feature-requests' },
          created: { $ref: '#/components/schemas/Timestamp' },
        },
      },
      
      // User schemas
      User: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/ObjectId' },
          userID: { type: 'string', example: 'user_12345' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'john@example.com' },
          avatarURL: { type: 'string', format: 'uri', example: 'https://example.com/avatar.jpg' },
          isAdmin: { type: 'boolean', default: false },
          created: { $ref: '#/components/schemas/Timestamp' },
          lastActivity: { $ref: '#/components/schemas/Timestamp' },
        },
      },
      
      // Post schemas
      Post: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/ObjectId' },
          title: { type: 'string', example: 'Add dark mode support' },
          details: { type: 'string', example: 'It would be great to have a dark mode option...' },
          status: {
            type: 'string',
            enum: ['open', 'under review', 'planned', 'in progress', 'complete', 'closed'],
            example: 'planned',
          },
          score: { type: 'number', example: 42 },
          commentCount: { type: 'number', example: 5 },
          board: { $ref: '#/components/schemas/Board' },
          author: { $ref: '#/components/schemas/User' },
          category: { $ref: '#/components/schemas/Category' },
          tags: {
            type: 'array',
            items: { $ref: '#/components/schemas/Tag' },
          },
          created: { $ref: '#/components/schemas/Timestamp' },
          statusChangedAt: { $ref: '#/components/schemas/Timestamp' },
        },
      },
      
      // Vote schemas
      Vote: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/ObjectId' },
          post: { $ref: '#/components/schemas/Post' },
          voter: { $ref: '#/components/schemas/User' },
          created: { $ref: '#/components/schemas/Timestamp' },
        },
      },
      
      // Comment schemas
      Comment: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/ObjectId' },
          post: { $ref: '#/components/schemas/Post' },
          author: { $ref: '#/components/schemas/User' },
          value: { type: 'string', example: 'Great idea! This would be really helpful.' },
          internal: { type: 'boolean', default: false },
          parentID: { $ref: '#/components/schemas/ObjectId' },
          created: { $ref: '#/components/schemas/Timestamp' },
        },
      },
      
      // Category schemas
      Category: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/ObjectId' },
          name: { type: 'string', example: 'UI/UX' },
          postCount: { type: 'number', example: 15 },
          board: { $ref: '#/components/schemas/Board' },
          created: { $ref: '#/components/schemas/Timestamp' },
        },
      },
      
      // Tag schemas
      Tag: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/ObjectId' },
          name: { type: 'string', example: 'high-priority' },
          postCount: { type: 'number', example: 8 },
          board: { $ref: '#/components/schemas/Board' },
          created: { $ref: '#/components/schemas/Timestamp' },
        },
      },
      
      // Changelog schemas
      ChangelogEntry: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/ObjectId' },
          title: { type: 'string', example: 'New Feature: Dark Mode' },
          details: { type: 'string', example: '## What\'s New\n\nWe\'ve added dark mode support...' },
          labels: {
            type: 'array',
            items: { type: 'string' },
            example: ['feature', 'ui'],
          },
          types: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['new', 'improved', 'fixed'],
            },
            example: ['new'],
          },
          publishedAt: { $ref: '#/components/schemas/Timestamp' },
          created: { $ref: '#/components/schemas/Timestamp' },
        },
      },
      
      // Company schemas
      Company: {
        type: 'object',
        properties: {
          id: { $ref: '#/components/schemas/ObjectId' },
          name: { type: 'string', example: 'Acme Inc.' },
          subdomain: { type: 'string', example: 'acme' },
          created: { $ref: '#/components/schemas/Timestamp' },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Boards', description: 'Board management' },
    { name: 'Posts', description: 'Feedback post management' },
    { name: 'Users', description: 'User management' },
    { name: 'Votes', description: 'Vote management' },
    { name: 'Comments', description: 'Comment management' },
    { name: 'Categories', description: 'Category management' },
    { name: 'Tags', description: 'Tag management' },
    { name: 'Changelog', description: 'Changelog entries' },
    { name: 'Companies', description: 'Company management' },
  ],
};

const options: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: ['./src/routes/v1/*.ts', './src/swagger/*.yaml'],
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'OpenFeedback API Documentation',
  }));
  
  // Serve raw spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
