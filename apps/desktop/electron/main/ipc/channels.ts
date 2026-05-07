export const IPC = {
  // Shell
  SHELL_GET_BOOTSTRAP: 'shell:get-bootstrap',
  SHELL_LOGIN: 'shell:login',
  SHELL_SIGNUP: 'shell:signup',
  SHELL_LOGOUT: 'shell:logout',
  SHELL_GRAPHQL: 'shell:graphql',
  SHELL_SET_THEME: 'shell:set-theme',
  SHELL_GET_SERVER_URL: 'shell:get-server-url',
  SHELL_SET_SERVER_URL: 'shell:set-server-url',
  SHELL_PROBE_SERVER: 'shell:probe-server',

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

  // App manifest (.well-known/dashway-app.json)
  APP_MANIFEST_FETCH: 'app:manifest-fetch',

  // Events (main → renderer)
  EVENT_WINDOW_FOCUS: 'event:window-focus',
  EVENT_WINDOW_BLUR: 'event:window-blur',
  EVENT_DEEP_LINK: 'event:deep-link',
  EVENT_SESSION_INVALIDATED: 'event:session-invalidated',
} as const
