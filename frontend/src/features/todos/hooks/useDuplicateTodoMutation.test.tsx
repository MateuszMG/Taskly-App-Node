import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { expect, it, vi } from 'vitest'
import { todoFixture } from '../../../test/todoFixture'
import { todoKeys } from '../api/queryKeys'
import { todosApi } from '../api/todos'
import { useDuplicateTodoMutation } from './useDuplicateTodoMutation'

vi.mock('../api/todos', () => ({ todosApi: { duplicate: vi.fn() } }))

function renderMutation(initial?: typeof todoFixture[]) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  if (initial) client.setQueryData(todoKeys.list, initial)
  const cancel = vi.spyOn(client, 'cancelQueries')
  const hook = renderHook(() => useDuplicateTodoMutation(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
  return { client, cancel, ...hook }
}

it('puts the duplicated task at the front and drops the stale copy', async () => {
  const saved = { ...todoFixture, id: 9, title: 'Copy' }
  const stale = { ...todoFixture, id: 9, title: 'Old copy' }
  vi.mocked(todosApi.duplicate).mockResolvedValue(saved)
  const { result, client, cancel } = renderMutation([todoFixture, stale])
  await act(async () => {
    await result.current.mutateAsync(todoFixture.id)
  })
  expect(todosApi.duplicate).toHaveBeenCalledWith(todoFixture.id)
  expect(cancel).toHaveBeenCalledWith({ queryKey: todoKeys.list })
  expect(client.getQueryData(todoKeys.list)).toEqual([saved, todoFixture])
})

it('starts a list when the cache is still empty', async () => {
  vi.mocked(todosApi.duplicate).mockResolvedValue(todoFixture)
  const { result, client } = renderMutation()
  await act(async () => {
    await result.current.mutateAsync(todoFixture.id)
  })
  expect(client.getQueryData(todoKeys.list)).toEqual([todoFixture])
})
