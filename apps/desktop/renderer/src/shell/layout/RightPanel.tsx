import { useShellStore } from '../model/shell-store'

export function RightPanel() {
  const { rightPanelContent } = useShellStore()

  return (
    <aside className="right-panel no-select">
      <div style={{ color: 'var(--fg-3)', fontSize: '0.75rem' }}>
        {rightPanelContent === 'ai' ? 'AI Assistant' : 'Details'}
      </div>
    </aside>
  )
}
