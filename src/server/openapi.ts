import { generateOpenApiDocument } from 'trpc-to-openapi';
import { appRouter } from './routers/_app';

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Blinko CRUD API V1',
  description: 'blinko api for public endpoints',
  version: '1.0.0',
  baseUrl: '/api',
  tags: ['Note', 'User', 'Task', 'Tag', 'Public', 'Config'],
});
