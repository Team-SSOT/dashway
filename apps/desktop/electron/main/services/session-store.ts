interface Session {
  userId: string
  workspaceId: string
}

let currentSession: Session = {
  userId: 'user-local',
  workspaceId: 'ws-default',
}

export const sessionStore = {
  get(): Session {
    return currentSession
  },

  set(session: Session): void {
    currentSession = session
  },
}
