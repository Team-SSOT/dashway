import { X } from '@dashway/ui/icons'
import { useTheme } from '../../app/providers/ThemeProvider'
import { useShellStore } from '../model/shell-store'

function SettingsContent() {
  const { theme, setTheme } = useTheme()
  const { currentMember, workspaces, activeWorkspaceId, workspaceConfig } = useShellStore()
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId)

  return (
    <div className="settings">
      <section className="settings__section">
        <h3 className="settings__heading">Account</h3>
        <div className="settings__row">
          <span className="settings__label">Name</span>
          <span className="settings__value">{currentMember?.name ?? '—'}</span>
        </div>
        <div className="settings__row">
          <span className="settings__label">Email</span>
          <span className="settings__value">{currentMember?.email ?? '—'}</span>
        </div>
      </section>

      <section className="settings__section">
        <h3 className="settings__heading">Workspace</h3>
        <div className="settings__row">
          <span className="settings__label">Active</span>
          <span className="settings__value">{activeWorkspace?.name ?? '—'}</span>
        </div>
        <div className="settings__row">
          <span className="settings__label">Default app</span>
          <span className="settings__value">{workspaceConfig?.defaultApp ?? '—'}</span>
        </div>
        <div className="settings__row">
          <span className="settings__label">Enabled apps</span>
          <span className="settings__value">{workspaceConfig?.enabledApps?.length ?? 0}</span>
        </div>
      </section>

      <section className="settings__section">
        <h3 className="settings__heading">Appearance</h3>
        <div className="settings__seg">
          {(['system', 'light', 'dark'] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={theme === t}
              data-active={theme === t}
              className="settings__seg-btn"
              onClick={() => setTheme(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function PlaceholderContent({ label }: { label: string }) {
  return <div style={{ color: 'var(--fg-3)', fontSize: '0.75rem' }}>{label}</div>
}

export function RightPanel() {
  const { rightPanelContent, closeRightPanel } = useShellStore()

  const title =
    rightPanelContent === 'settings'
      ? 'Settings'
      : rightPanelContent === 'ai'
        ? 'AI Assistant'
        : 'Details'

  return (
    <aside className="right-panel no-select" aria-label={title}>
      <header className="right-panel__header">
        <h2 className="right-panel__title">{title}</h2>
        <button
          type="button"
          className="right-panel__close"
          onClick={closeRightPanel}
          aria-label="Close panel"
        >
          <X size={14} />
        </button>
      </header>
      <div className="right-panel__body">
        {rightPanelContent === 'settings' ? (
          <SettingsContent />
        ) : (
          <PlaceholderContent label={title} />
        )}
      </div>
    </aside>
  )
}
