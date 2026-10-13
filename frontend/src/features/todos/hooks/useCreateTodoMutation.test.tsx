import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { expect, it, vi } from 'vitest'
import { todoFixture } from '../../../test/todoFixture'
import { todoKeys } from '../api/queryKeys'
import { todosApi } from '../api/todos'
import type { Todo } from '../types'
import { useCreateTodoMutation } from './useCreateTodoMutation'

vi.mock('../api/todos', () => ({ todosApi: { create: vi.fn() } }))

function renderMutation(initial?: Todo[]) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  if (initial) client.setQueryData(todoKeys.list, initial)
  const cancel = vi.spyOn(client, 'cancelQueries')
  const hook = renderHook(() => useCreateTodoMutation(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
  return { client, cancel, ...hook }
}

it('puts the saved task at the front and drops the stale copy', async () => {
  const saved = { ...todoFixture, id: 9, title: 'Saved' }
  const duplicate = { ...todoFixture, id: 9, title: 'Old copy' }
  vi.mocked(todosApi.create).mockResolvedValue(saved)
  const { result, client, cancel } = renderMutation([todoFixture, duplicate])
  await act(async () => {
    await result.current.mutateAsync(todoFixture)
  })
  expect(todosApi.create).toHaveBeenCalledWith(todoFixture)
  expect(cancel).toHaveBeenCalledWith({ queryKey: todoKeys.list })
  expect(client.getQueryData(todoKeys.list)).toEqual([saved, todoFixture])
})

it('starts a list when the cache is still empty', async () => {
  vi.mocked(todosApi.create).mockResolvedValue(todoFixture)
  const { result, client } = renderMutation()
  await act(async () => {
    await result.current.mutateAsync(todoFixture)
  })
  expect(client.getQueryData(todoKeys.list)).toEqual([todoFixture])
})
