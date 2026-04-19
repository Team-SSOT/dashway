export const isElectron = (): boolean =>
  typeof window !== 'undefined' && window.issueTracker?.isElectron === true

export const runtimeLabel = (): 'electron' | 'browser' => (isElectron() ? 'electron' : 'browser')
