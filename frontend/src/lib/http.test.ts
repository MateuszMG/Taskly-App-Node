import { afterEach, expect, it, vi } from 'vitest'
import { request } from './http'

afterEach(() => vi.unstubAllGlobals())

it('returns JSON from a successful response and sends JSON headers', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )
  vi.stubGlobal('fetch', fetchMock)
  await expect(request('/todos')).resolves.toEqual({ ok: true })
  expect(fetchMock).toHaveBeenCalledWith('/api/todos', {
    headers: { 'Content-Type': 'application/json' },
  })
})

it('keeps caller headers and returns nothing for an empty success', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetchMock)
  await expect(
    request('/todos/1', {
      method: 'DELETE',
      headers: { 'X-Request-Id': 'abc' },
    }),
  ).resolves.toBeUndefined()
  expect(fetchMock).toHaveBeenCalledWith('/api/todos/1', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'abc' },
  })
})

it('explains a validation failure from the server', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('{}', { status: 422 })),
  )
  await expect(request('/todos', { method: 'POST' })).rejects.toThrow(
    'Check the task details: title up to 120 characters, description up to 2000 characters, and a valid due date.',
  )
})

it('uses the server detail when a request fails', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Task not found.' }), {
          status: 404,
        }),
      ),
  )
  await expect(request('/todos/9')).rejects.toThrow('Task not found.')
})

it('uses a generic message when the error body has no detail', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('not-json', { status: 500 })),
  )
  await expect(request('/todos')).rejects.toThrow(
    'The operation failed. Please try again.',
  )
})

it('reports that the server cannot be reached', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
  await expect(request('/todos')).rejects.toThrow(
    'Cannot connect to the server. Please try again.',
  )
})

it('preserves an aborted request instead of replacing it', async () => {
  const controller = new AbortController()
  controller.abort()
  const abortError = new DOMException(
    'The operation was aborted.',
    'AbortError',
  )
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError))
  await expect(request('/todos', { signal: controller.signal })).rejects.toBe(
    abortError,
  )
})
