import { expect, it, vi } from 'vitest';
import { createDatabase, initialize } from '../src/core/database.ts';

it('opens a client without connecting to PostgreSQL', async () => {
  const database = createDatabase('postgresql://test:test@127.0.0.1:5432/test');
  expect(database.todo).toBeDefined();
  await database.$disconnect();
});

it('creates the todos table when the database is initialized', async () => {
  const execute = vi.fn().mockResolvedValue(0);
  await initialize({ $executeRaw: execute } as never);
  expect(execute).toHaveBeenCalledOnce();
});
