import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { ChatMessage } from '@/types/chat'
import { simpleText } from '@/data/mockData'
import { MoreMenu, buildMessageLink } from '../MoreMenu'

function makeMsg(overrides: Partial<ChatMessage> = {}): ChatMessage {
  const now = new Date().toISOString()
  return {
    id: 'msg-x',
    roomId: 'room-general',
    authorId: 'demo-user',
    content: simpleText('hello'),
    plainText: 'hello',
    clientCreatedAt: now,
    serverCreatedAt: now,
    editedAt: null,
    deletedAt: null,
    threadParentId: null,
    replyCount: 0,
    clientMsgId: 'cmid-x',
    contentVersion: 1,
    version: 1,
    ...overrides,
  }
}

describe('buildMessageLink', () => {
  it('uses ?m= for non-thread messages', () => {
    const url = buildMessageLink(
      { id: 'msg-x', roomId: 'room-general', threadParentId: null },
      'http://localhost:5173',
    )
    expect(url).toBe('http://localhost:5173/c/room-general?m=msg-x')
  })

  it('uses /thread/:parentId for thread replies', () => {
    const url = buildMessageLink(
      { id: 'msg-r1', roomId: 'room-general', threadParentId: 'msg-parent' },
      'http://localhost:5173',
    )
    expect(url).toBe('http://localhost:5173/c/room-general/thread/msg-parent')
  })
})

describe('<MoreMenu />', () => {
  it('opens on trigger click and shows Copy items', () => {
    render(
      <MoreMenu
        message={makeMsg()}
        canDelete={false}
        onDelete={() => {}}
        open
        onOpenChange={() => {}}
      />,
    )
    expect(screen.getByRole('menuitem', { name: /Copy link/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Copy text/i })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /Delete/i })).not.toBeInTheDocument()
  })

  it('renders Delete item when canDelete=true', () => {
    render(
      <MoreMenu
        message={makeMsg()}
        canDelete
        onDelete={() => {}}
        open
        onOpenChange={() => {}}
      />,
    )
    expect(screen.getByRole('menuitem', { name: /Delete/i })).toBeInTheDocument()
  })

  it('clicking Copy text writes plainText to clipboard', () => {
    const writeSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    render(
      <MoreMenu
        message={makeMsg({ plainText: 'hello world' })}
        canDelete={false}
        onDelete={() => {}}
        open
        onOpenChange={() => {}}
      />,
    )
    fireEvent.click(screen.getByRole('menuitem', { name: /Copy text/i }))
    expect(writeSpy).toHaveBeenCalledWith('hello world')
    writeSpy.mockRestore()
  })

  it('clicking Delete invokes onDelete', () => {
    const onDelete = vi.fn()
    render(
      <MoreMenu
        message={makeMsg()}
        canDelete
        onDelete={onDelete}
        open
        onOpenChange={() => {}}
      />,
    )
    fireEvent.click(screen.getByRole('menuitem', { name: /Delete/i }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
