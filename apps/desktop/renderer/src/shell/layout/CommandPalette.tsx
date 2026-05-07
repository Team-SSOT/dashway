import type { WorkspaceApp } from '@dashway/config-schema'
import { Search } from '@dashway/ui/icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useShellStore } from '../model/shell-store'
import { resolveIcon } from './icon-resolver'

export function CommandPalette() {
  const navigate = useNavigate()
  const commandPaletteOpen = useShellStore((s) => s.commandPaletteOpen)
  const setCommandPaletteOpen = useShellStore((s) => s.setCommandPaletteOpen)
  const setActiveApp = useShellStore((s) => s.setActiveApp)
  const workspaceConfig = useShellStore((s) => s.workspaceConfig)

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const apps = workspaceConfig?.apps ?? []
  const filtered = useMemo<WorkspaceApp[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return apps
    return apps.filter(
      (app) => app.title.toLowerCase().includes(q) || app.id.toLowerCase().includes(q),
    )
  }, [apps, query])

  useEffect(() => {
    if (!commandPaletteOpen) return
    setQuery('')
    setActiveIndex(0)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [commandPaletteOpen])

  // Reset highlight when query changes; setActiveIndex isn't a real dep here.
  // biome-ignore lint/correctness/useExhaustiveDependencies: query change is the trigger
  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  if (!commandPaletteOpen) return null

  const close = () => setCommandPaletteOpen(false)

  const runApp = (app: WorkspaceApp) => {
    setActiveApp(app.id)
    navigate(`/apps/${app.id}`)
    close()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (filtered.length === 0 ? 0 : (i + 1) % filtered.length))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) =>
        filtered.length === 0 ? 0 : (i - 1 + filtered.length) % filtered.length,
      )
      return
    }
    if (e.key === 'Enter') {
      const target = filtered[activeIndex]
      if (target) {
        e.preventDefault()
        runApp(target)
      }
    }
  }

  const onOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) close()
  }

  return (
    <div
      className="cmdk-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onMouseDown={onOverlayMouseDown}
    >
      <div className="cmdk">
        <div className="cmdk__input-row">
          <Search size={14} />
          <input
            ref={inputRef}
            className="cmdk__input"
            placeholder="Search apps…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <span className="cmdk__hint">Esc</span>
        </div>
        <div className="cmdk__list" role="listbox">
          {filtered.length === 0 ? (
            <div className="cmdk__empty">No matches</div>
          ) : (
            filtered.map((app, idx) => {
              const Icon = resolveIcon(app.icon)
              const active = idx === activeIndex
              return (
                <button
                  key={app.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className="cmdk__item"
                  data-active={active}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => runApp(app)}
                >
                  <span className="cmdk__item-icon">
                    {Icon ? <Icon size={14} /> : app.title.charAt(0).toUpperCase()}
                  </span>
                  <span className="cmdk__item-title">{app.title}</span>
                  <span className="cmdk__item-id">{app.id}</span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
