import { afterEach, expect, it } from 'vitest';
import { resolveDatabaseUrl } from '../src/core/config.ts';

const keys = ['DATABASE_URL', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_HOST', 'DB_PORT', 'POSTGRES_DB'] as const;
const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

function clearDatabaseEnv() {
  for (const key of keys) delete process.env[key];
}

it('prefers an explicit connection string', () => {
  clearDatabaseEnv();
  process.env.DATABASE_URL = 'postgresql://from-env/db';
  expect(resolveDatabaseUrl('postgresql://explicit/db')).toBe('postgresql://explicit/db');
});

it('normalizes a SQLAlchemy connection string from the environment', () => {
  clearDatabaseEnv();
  process.env.DATABASE_URL = 'postgresql+psycopg://user:secret@db.internal:5432/taskly';
  expect(resolveDatabaseUrl()).toBe('postgresql://user:secret@db.internal:5432/taskly');
});

it('builds a connection string from the Postgres environment', () => {
  clearDatabaseEnv();
  process.env.POSTGRES_USER = 'taskly';
  process.env.POSTGRES_PASSWORD = 'p@ss word';
  process.env.POSTGRES_HOST = 'db.internal';
  process.env.DB_PORT = '5432';
  process.env.POSTGRES_DB = 'taskly app';
  const url = new URL(resolveDatabaseUrl());
  expect(url.protocol).toBe('postgresql:');
  expect(url.username).toBe('taskly');
  expect(decodeURIComponent(url.password)).toBe('p@ss word');
  expect(url.hostname).toBe('db.internal');
  expect(url.port).toBe('5432');
  expect(url.pathname).toBe('/taskly%20app');
});

it('reports the first missing Postgres variable', () => {
  clearDatabaseEnv();
  process.env.POSTGRES_PASSWORD = 'secret';
  expect(() => resolveDatabaseUrl()).toThrow('Missing environment variable: POSTGRES_USER');
});
