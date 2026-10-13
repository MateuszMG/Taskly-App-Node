import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { todoFixture } from '../../../test/todoFixture'
import { TodoItem } from './TodoItem'

vi.mock('../../../design-system', () => import('../../../design-system/mocks'))

it('shows an active task and forwards edit requests', async () => {
  const user = userEvent.setup()
  const onEdit = vi.fn()
  const onToggle = vi.fn()
  const onDelete = vi.fn()
  const onDuplicate = vi.fn()
  render(
    <TodoItem
      todo={todoFixture}
      busy={false}
      onEdit={onEdit}
      onToggle={onToggle}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    />,
  )
  expect(screen.getByRole('heading', { name: todoFixture.title })).toBeVisible()
  expect(screen.getByText('To do')).toBeVisible()
  expect(screen.getByText('Medium')).toBeVisible()
  expect(screen.getByRole('checkbox')).not.toBeChecked()
  await user.click(
    screen.getByRole('button', { name: `Edit: ${todoFixture.title}` }),
  )
  expect(onEdit).toHaveBeenCalledTimes(1)
  expect(onToggle).not.toHaveBeenCalled()
  expect(onDelete).not.toHaveBeenCalled()
})

it('forwards duplicate requests from the copy action', async () => {
  const user = userEvent.setup()
  const onDuplicate = vi.fn()
  render(
    <TodoItem
      todo={todoFixture}
      busy={false}
      onEdit={vi.fn()}
      onToggle={vi.fn()}
      onDelete={vi.fn()}
      onDuplicate={onDuplicate}
    />,
  )
  await user.click(
    screen.getByRole('button', { name: `Duplicate: ${todoFixture.title}` }),
  )
  expect(onDuplicate).toHaveBeenCalledTimes(1)
})
