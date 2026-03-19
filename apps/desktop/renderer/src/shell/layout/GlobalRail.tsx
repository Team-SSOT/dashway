import { useWorkspaceSwitch } from '../hooks/use-workspace-switch'
import { useShellStore } from '../model/shell-store'

export function GlobalRail() {
  const { workspaces, activeWorkspaceId } = useShellStore()
  const switchWorkspace = useWorkspaceSwitch()

  return (
    <nav className="global-rail no-select">
      <div className="drag-region" style={{ height: 20, width: '100%' }} />
      {workspaces.map((ws) => (
        <button
          type="button"
          key={ws.id}
          className="global-rail__item no-drag"
          data-active={activeWorkspaceId === ws.id}
          title={ws.name}
          style={activeWorkspaceId === ws.id && ws.color ? { borderColor: ws.color } : undefined}
          onClick={() => switchWorkspace(ws.id)}
        >
          {ws.icon ?? ws.name[0]}
        </button>
      ))}
    </nav>
  )
}
