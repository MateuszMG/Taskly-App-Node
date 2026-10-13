import express from 'express';
import request from 'supertest';
import { expect, it, vi } from 'vitest';
import { createHealthRouter } from '../src/api/health.ts';

it('reports ok after the database answers', async () => {
  const database = { todo: { findFirst: vi.fn().mockResolvedValue({ id: 1 }) } };
  const app = express();
  app.use('/api', createHealthRouter(database as never));
  const response = await request(app).get('/api/health');
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ status: 'ok' });
  expect(database.todo.findFirst).toHaveBeenCalledWith({ select: { id: true } });
});
