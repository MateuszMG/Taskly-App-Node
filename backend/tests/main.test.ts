import { afterEach, expect, it, vi } from 'vitest';

const start = vi.fn();

vi.mock('../src/core/lifespan.ts', () => ({ start }));

afterEach(() => {
  vi.resetModules();
  start.mockReset();
  vi.restoreAllMocks();
});

it('logs a startup failure and sets a failing exit code', async () => {
  start.mockRejectedValueOnce(new Error('boom'));
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const previous = process.exitCode;
  await import('../src/main.ts');
  await vi.waitFor(() => expect(process.exitCode).toBe(1));
  expect(error).toHaveBeenCalledWith('Cannot start Taskly App Node API:', expect.any(Error));
  process.exitCode = previous;
});

it('starts the server when startup succeeds', async () => {
  start.mockResolvedValueOnce({ server: {}, database: {} });
  const previous = process.exitCode;
  process.exitCode = undefined;
  await import('../src/main.ts?success');
  await vi.waitFor(() => expect(start).toHaveBeenCalled());
  expect(process.exitCode).toBeUndefined();
  process.exitCode = previous;
});
