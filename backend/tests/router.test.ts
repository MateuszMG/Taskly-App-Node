import express from 'express';
import request from 'supertest';
import { it, expect, vi } from 'vitest';
import { createTodosRouter } from '../src/features/todos/router.ts';
import { todo } from './fixture.ts';

function setup() {
  const repository = { list: vi.fn().mockResolvedValue([todo]), create: vi.fn().mockResolvedValue(todo), get: vi.fn(), update: vi.fn(), delete: vi.fn(), duplicate: vi.fn() };
  const app = express();
  app.use(express.json());
  app.use('/api/todos', createTodosRouter(repository));
  return { app, repository };
}
it('lists tasks from the repository', async () => {
  const { app, repository } = setup();
  const response = await request(app).get('/api/todos');
  expect(response.status).toBe(200);
  expect(response.body).toEqual([todo]);
  expect(repository.list).toHaveBeenCalledOnce();
});
it('creates tasks with trimmed input and defaults', async () => {
  const { app, repository } = setup();
  const response = await request(app).post('/api/todos').send({ title: '  Plan the sprint  ', priority: 'high' });
  expect(response.status).toBe(201);
  expect(response.body).toEqual(todo);
  expect(repository.create).toHaveBeenCalledWith({ title: 'Plan the sprint', description: '', priority: 'high', due_date: null, completed: false });
});
it.each([{ title: '  ' }, { title: 'x'.repeat(121) }, { title: 'Task', priority: 'urgent' }, { title: 'Task', due_date: '2026-02-30' }])(
  'rejects invalid create input without calling the repository: %j', async (payload) => {
    const { app, repository } = setup();
    expect((await request(app).post('/api/todos').send(payload)).status).toBe(422);
    expect(repository.create).not.toHaveBeenCalled();
  },
);
it('duplicates a task through the repository', async () => {
  const { app, repository } = setup();
  repository.duplicate.mockResolvedValue(todo);
  const response = await request(app).post('/api/todos/1/duplicate');
  expect(response.status).toBe(201);
  expect(response.body).toEqual(todo);
  expect(repository.duplicate).toHaveBeenCalledWith(1);
});
it('returns 404 when duplicating a missing task', async () => {
  const { app, repository } = setup();
  repository.duplicate.mockResolvedValue(null);
  const response = await request(app).post('/api/todos/1/duplicate');
  expect(response.status).toBe(404);
  expect(response.body).toEqual({ detail: 'Task not found.' });
});
it('rejects invalid duplicate ids without calling the repository', async () => {
  const { app, repository } = setup();
  expect((await request(app).post('/api/todos/0/duplicate')).status).toBe(422);
  expect(repository.duplicate).not.toHaveBeenCalled();
});
