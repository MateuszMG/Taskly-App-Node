import request from 'supertest';
import { afterEach, expect, it, vi } from 'vitest';
import { createApp } from '../src/factory.ts';

afterEach(() => vi.restoreAllMocks());

function setup() {
  const database = {
    todo: {
      findFirst: vi.fn().mockResolvedValue({ id: 1 }),
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
  return { app: createApp(database as never), database };
}

it('serves health, the OpenAPI document, and a JSON 404', async () => {
  const { app, database } = setup();
  const health = await request(app).get('/api/health');
  expect(health.status).toBe(200);
  expect(health.body).toEqual({ status: 'ok' });
  expect(database.todo.findFirst).toHaveBeenCalledOnce();
  expect(health.headers['x-powered-by']).toBeUndefined();

  const specification = await request(app).get('/openapi.json');
  expect(specification.status).toBe(200);
  expect(specification.body.openapi).toBeTypeOf('string');

  const missing = await request(app).get('/missing');
  expect(missing.status).toBe(404);
  expect(missing.body).toEqual({ detail: 'Not Found' });
});

it('rejects invalid JSON and oversized bodies before they reach a route', async () => {
  const { app } = setup();
  const invalid = await request(app)
    .post('/api/todos')
    .set('Content-Type', 'application/json')
    .send('{');
  expect(invalid.status).toBe(422);
  expect(invalid.body).toEqual({ detail: 'Invalid JSON.' });

  const oversized = await request(app)
    .post('/api/todos')
    .set('Content-Type', 'application/json')
    .send(`{"title":"${'x'.repeat(200_000)}"}`);
  expect(oversized.status).toBe(413);
  expect(oversized.body).toEqual({ detail: 'Request body too large.' });
});

it('hides unexpected failures behind a server error', async () => {
  const { app, database } = setup();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  database.todo.findMany.mockRejectedValue(new Error('database unavailable'));
  const response = await request(app).get('/api/todos');
  expect(response.status).toBe(500);
  expect(response.body).toEqual({ detail: 'Internal Server Error' });
});
