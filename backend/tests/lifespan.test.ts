import type { Server } from 'node:http';
import { afterEach, expect, it, vi } from 'vitest';

const database = {
  $connect: vi.fn().mockResolvedValue(undefined),
  $disconnect: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../src/core/config.ts', () => ({ resolveDatabaseUrl: () => 'postgresql://test' }));
vi.mock('../src/core/database.ts', () => ({
  createDatabase: () => database,
  initialize: vi.fn().mockResolvedValue(undefined),
}));

const { start } = await import('../src/core/lifespan.ts');
const { initialize } = await import('../src/core/database.ts');

afterEach(() => {
  database.$connect.mockReset().mockResolvedValue(undefined);
  database.$disconnect.mockReset().mockResolvedValue(undefined);
  vi.mocked(initialize).mockReset().mockResolvedValue(undefined);
  vi.restoreAllMocks();
});

it('listens after the database connects and can shut down', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  const previous = process.env.API_PORT;
  process.env.API_PORT = '0';
  const started = await start();
  expect(database.$connect).toHaveBeenCalledOnce();
  expect(initialize).toHaveBeenCalledWith(database);
  expect((started.server.address() as { port: number }).port).toBeGreaterThan(0);

  const closed = new Promise<void>((resolve) => started.server.once('close', () => resolve()));
  process.emit('SIGTERM');
  await closed;
  expect(database.$disconnect).toHaveBeenCalledOnce();
  process.env.API_PORT = previous;
});

it('disconnects and rethrows when startup fails', async () => {
  database.$connect.mockRejectedValueOnce(new Error('cannot connect'));
  await expect(start()).rejects.toThrow('cannot connect');
  expect(database.$disconnect).toHaveBeenCalledOnce();
});

it('records a disconnect failure while shutting down', async () => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const previousPort = process.env.API_PORT;
  const previousExit = process.exitCode;
  process.env.API_PORT = '0';
  database.$disconnect.mockRejectedValueOnce(new Error('disconnect failed'));
  const started = await start();
  const closed = new Promise<void>((resolve) => started.server.once('close', () => resolve()));
  process.emit('SIGINT');
  await closed;
  expect(error).toHaveBeenCalled();
  expect(process.exitCode).toBe(1);
  process.exitCode = previousExit;
  process.env.API_PORT = previousPort;
  await new Promise<void>((resolve) => (started.server as Server).close(() => resolve()));
});
