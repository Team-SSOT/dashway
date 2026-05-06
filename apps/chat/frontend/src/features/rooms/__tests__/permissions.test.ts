import { describe, it, expect } from 'vitest'
import { canDeleteMessage, canManageMembers } from '../permissions'

describe('canManageMembers', () => {
  it('OWNER and ADMIN can manage', () => {
    expect(canManageMembers('OWNER')).toBe(true)
    expect(canManageMembers('ADMIN')).toBe(true)
  })
  it('MEMBER, GUEST, undefined cannot', () => {
    expect(canManageMembers('MEMBER')).toBe(false)
    expect(canManageMembers('GUEST')).toBe(false)
    expect(canManageMembers(undefined)).toBe(false)
  })
})

describe('canDeleteMessage', () => {
  const ME = 'demo-user'

  it('author can always delete their own', () => {
    expect(canDeleteMessage({ role: 'MEMBER', authorId: ME, currentUserId: ME })).toBe(true)
    expect(canDeleteMessage({ role: 'GUEST', authorId: ME, currentUserId: ME })).toBe(true)
    expect(canDeleteMessage({ role: undefined, authorId: ME, currentUserId: ME })).toBe(true)
  })

  it('OWNER and ADMIN can delete others', () => {
    expect(canDeleteMessage({ role: 'OWNER', authorId: 'alice', currentUserId: ME })).toBe(true)
    expect(canDeleteMessage({ role: 'ADMIN', authorId: 'alice', currentUserId: ME })).toBe(true)
  })

  it('MEMBER and GUEST cannot delete others', () => {
    expect(canDeleteMessage({ role: 'MEMBER', authorId: 'alice', currentUserId: ME })).toBe(false)
    expect(canDeleteMessage({ role: 'GUEST', authorId: 'alice', currentUserId: ME })).toBe(false)
    expect(canDeleteMessage({ role: undefined, authorId: 'alice', currentUserId: ME })).toBe(false)
  })
})
