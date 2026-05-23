# chat-frontend

React + TypeScript frontend for the Dashway chat feature.

## Running

```bash
pnpm --filter chat-frontend dev
```

Runs on **http://localhost:5173** by default (Vite default port).

## Tests

```bash
pnpm --filter chat-frontend test
```

Runs Vitest in watch mode. For a single CI pass:

```bash
pnpm --filter chat-frontend test --run
```

## Type-check / build

```bash
pnpm --filter chat-frontend typecheck
pnpm --filter chat-frontend build
```

## Mock dev-console toggles

Open the browser DevTools console and use `window.__chatMocks`:

| Command | Effect |
|---------|--------|
| `__chatMocks.loadHeavyDataset()` | Load 1000+ message dataset; then navigate to `/c/heavy` |
| `__chatMocks.disconnect()` | Simulate WebSocket disconnect → reconnect cycle |
| `__chatMocks.triggerError('listMessages')` | Next call of that repository method rejects with a `UNKNOWN` ChatError |

**URL shortcut:** `/c/general?heavy=1` auto-triggers `loadHeavyDataset()` on mount — useful for one-step perf recording.

## Architecture

Feature-first folder structure under `src/`:

```
src/
  app/          # Root providers, router, query client
  features/
    auth/       # Auth context + login gate
    rooms/      # Sidebar, room list, RoomView
    messages/   # MessageList, MessageItem, DateDivider, hooks
    composer/   # Lexical-powered rich-text composer
    renderer/   # Lexical → React renderer + golden fixtures
    threads/    # Thread panel (US-004)
  shared/
    lib/        # cn, date utilities
    store/      # Zustand slices
    ui/         # shadcn/ui primitives (auto-generated, do not edit)
  types/        # ChatRepository / ChatRealtime interfaces + domain types
  data/         # MockChatRepository, MockChatRealtime, mockData
  pages/        # Route-level page components
```

### Data layer abstraction

All data access goes through two interfaces defined in `src/types/chat.ts`:

- **`ChatRepository`** — async CRUD (listRooms, listMessages, sendMessage, …)
- **`ChatRealtime`** — WebSocket event subscription (subscribe/unsubscribe)

The current implementation uses `MockChatRepository` + `MockChatRealtime` (in-memory, event-bus driven). These will be replaced by HTTP/STOMP implementations during the BE integration phase without touching feature code.

### Lexical rich-text

Composer uses [Lexical](https://lexical.dev/) pinned at `0.43.0`. All message content is stored as `SerializedEditorState` JSON. The renderer (`features/renderer/renderLexical.tsx`) converts this to React elements. Golden fixture JSON files live in `features/renderer/__fixtures__/`.

### Plans & specs

- Full UI plan: `.omc/plans/chat-frontend-ui-v1.md`
- BE handoff spec: `.omc/handoff/chat-frontend-ui-v1-be-spec.md`
