export const IPC = {
  // Shell
  SHELL_GET_BOOTSTRAP: 'shell:get-bootstrap',
  SHELL_SET_THEME: 'shell:set-theme',

  // Workspace
  WORKSPACE_GET_CONFIG: 'workspace:get-config',
  WORKSPACE_SWITCH: 'workspace:switch',
  WORKSPACE_CONFIG_CHANGED: 'workspace:config-changed',

  // Window
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',

  // System
  SYSTEM_GET_PLATFORM: 'system:get-platform',

  // Events (main → renderer)
  EVENT_WINDOW_FOCUS: 'event:window-focus',
  EVENT_WINDOW_BLUR: 'event:window-blur',
  EVENT_DEEP_LINK: 'event:deep-link',
} as const
