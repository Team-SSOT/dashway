import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { Reaction } from '@/types/chat'
import { ReactionChips, __test__ } from '../ReactionChips'

// currentUserId from mockData.ts:257 is 'demo-user'.
const ME = 'demo-user'

const { summarize } = __test__

describe('summarize', () => {
  it('returns empty when reactions are nullish or empty', () => {
    expect(summarize(undefined, ME)).toEqual([])
    expect(summarize([], ME)).toEqual([])
  })

  it('drops entries with empty userIds', () => {
    const r: Reaction[] = [
      { emoji: '👍', userIds: [] },
      { emoji: '🎉', userIds: ['alice'] },
    ]
    expect(summarize(r, ME)).toEqual([{ emoji: '🎉', count: 1, reactedByMe: false }])
  })

  it('marks reactedByMe correctly', () => {
    const r: Reaction[] = [
      { emoji: '👍', userIds: [ME, 'alice'] },
      { emoji: '🎉', userIds: ['alice'] },
    ]
    expect(summarize(r, ME)).toEqual([
      { emoji: '👍', count: 2, reactedByMe: true },
      { emoji: '🎉', count: 1, reactedByMe: false },
    ])
  })
})

describe('<ReactionChips />', () => {
  it('renders nothing when reactions are empty', () => {
    const { container } = render(<ReactionChips reactions={undefined} onToggle={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders one chip per emoji with count', () => {
    const reactions: Reaction[] = [
      { emoji: '👍', userIds: [ME, 'alice'] },
      { emoji: '🎉', userIds: ['bob'] },
    ]
    render(<ReactionChips reactions={reactions} onToggle={() => {}} />)
    const chips = screen.getAllByRole('button')
    expect(chips).toHaveLength(2)
    expect(chips[0]).toHaveTextContent('👍')
    expect(chips[0]).toHaveTextContent('2')
    expect(chips[0]).toHaveAttribute('aria-pressed', 'true')
    expect(chips[1]).toHaveTextContent('🎉')
    expect(chips[1]).toHaveTextContent('1')
    expect(chips[1]).toHaveAttribute('aria-pressed', 'false')
  })

  it('clicking a chip the user has reacted to toggles with hasMine=true', () => {
    const onToggle = vi.fn()
    const reactions: Reaction[] = [{ emoji: '👍', userIds: [ME, 'alice'] }]
    render(<ReactionChips reactions={reactions} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledWith('👍', true)
  })

  it('clicking a chip the user has NOT reacted to toggles with hasMine=false', () => {
    const onToggle = vi.fn()
    const reactions: Reaction[] = [{ emoji: '🎉', userIds: ['alice'] }]
    render(<ReactionChips reactions={reactions} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledWith('🎉', false)
  })
})
