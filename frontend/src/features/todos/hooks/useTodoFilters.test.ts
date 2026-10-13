import { act, renderHook } from '@testing-library/react'
import { expect, it } from 'vitest'
import { todoFixture } from '../../../test/todoFixture'
import { useTodoFilters } from './useTodoFilters'

it('starts with every task and narrows them as the filters change', () => {
  const completed = {
    ...todoFixture,
    id: 8,
    title: 'Ship the notes',
    completed: true,
    priority: 'high' as const,
  }
  const { result } = renderHook(() => useTodoFilters([todoFixture, completed]))
  expect(result.current.filter).toBe('all')
  expect(result.current.search).toBe('')
  expect(result.current.sort).toBe('newest')
  expect(result.current.visible.map((todo) => todo.id)).toEqual([8, 7])

  act(() => result.current.setFilter('completed'))
  expect(result.current.visible).toEqual([completed])

  act(() => {
    result.current.setFilter('all')
    result.current.setSearch('prepare')
  })
  expect(result.current.visible).toEqual([todoFixture])

  act(() => {
    result.current.setSearch('')
    result.current.setSort('priority')
  })
  expect(result.current.visible.map((todo) => todo.id)).toEqual([8, 7])
})
