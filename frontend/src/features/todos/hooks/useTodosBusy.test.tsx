import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { expect, it, vi } from 'vitest'
import { todoFixture } from '../../../test/todoFixture'
import { todosApi } from '../api/todos'
import { useCreateTodoMutation } from './useCreateTodoMutation'
import { useTodosBusy } from './useTodosBusy'

vi.mock('../api/todos', () => ({ todosApi: { create: vi.fn() } }))

it('is busy only while a task mutation is in flight', async () => {
  let finish: (value: typeof todoFixture) => void = () => {}
  vi.mocked(todosApi.create).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  const { result } = renderHook(
    () => ({ busy: useTodosBusy(), create: useCreateTodoMutation() }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )
  expect(result.current.busy).toBe(false)
  act(() => {
    result.current.create.mutate(todoFixture)
  })
  await waitFor(() => expect(result.current.busy).toBe(true))
  await act(async () => {
    finish(todoFixture)
  })
  await waitFor(() => expect(result.current.busy).toBe(false))
})
