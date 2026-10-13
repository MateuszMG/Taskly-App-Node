import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { expect, it, vi } from 'vitest'
import { todoFixture } from '../../../test/todoFixture'
import { todoKeys } from '../api/queryKeys'
import { todosApi } from '../api/todos'
import { useDeleteTodoMutation } from './useDeleteTodoMutation'

vi.mock('../api/todos', () => ({ todosApi: { remove: vi.fn() } }))

function renderMutation(seedCache: boolean) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  if (seedCache) {
    client.setQueryData(todoKeys.list, [todoFixture, { ...todoFixture, id: 8 }])
  }
  const hook = renderHook(() => useDeleteTodoMutation(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
  return { client, ...hook }
}

it('removes the deleted task from the cached list', async () => {
  vi.mocked(todosApi.remove).mockResolvedValue(undefined)
  const { result, client } = renderMutation(true)
  await act(async () => {
    await result.current.mutateAsync(todoFixture.id)
  })
  expect(todosApi.remove).toHaveBeenCalledWith(todoFixture.id)
  expect(client.getQueryData(todoKeys.list)).toEqual([
    { ...todoFixture, id: 8 },
  ])
})

it('leaves a missing list cache untouched', async () => {
  vi.mocked(todosApi.remove).mockResolvedValue(undefined)
  const { result, client } = renderMutation(false)
  await act(async () => {
    await result.current.mutateAsync(todoFixture.id)
  })
  expect(client.getQueryData(todoKeys.list)).toBeUndefined()
})
