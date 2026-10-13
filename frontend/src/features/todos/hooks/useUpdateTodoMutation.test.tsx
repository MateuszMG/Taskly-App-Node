import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { expect, it, vi } from 'vitest'
import { todoFixture } from '../../../test/todoFixture'
import { todoKeys } from '../api/queryKeys'
import { todosApi } from '../api/todos'
import { useUpdateTodoMutation } from './useUpdateTodoMutation'

vi.mock('../api/todos', () => ({ todosApi: { update: vi.fn() } }))

function renderMutation(seedCache: boolean) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  if (seedCache) client.setQueryData(todoKeys.list, [todoFixture])
  const hook = renderHook(() => useUpdateTodoMutation(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
  return { client, ...hook }
}

it('replaces the updated task in the cached list', async () => {
  const saved = { ...todoFixture, completed: true }
  vi.mocked(todosApi.update).mockResolvedValue(saved)
  const { result, client } = renderMutation(true)
  await act(async () => {
    await result.current.mutateAsync({
      id: todoFixture.id,
      input: { completed: true },
    })
  })
  expect(todosApi.update).toHaveBeenCalledWith(todoFixture.id, {
    completed: true,
  })
  expect(client.getQueryData(todoKeys.list)).toEqual([saved])
})

it('leaves a missing list cache untouched', async () => {
  vi.mocked(todosApi.update).mockResolvedValue(todoFixture)
  const { result, client } = renderMutation(false)
  await act(async () => {
    await result.current.mutateAsync({
      id: todoFixture.id,
      input: { title: 'Next' },
    })
  })
  expect(client.getQueryData(todoKeys.list)).toBeUndefined()
})
