# Chat Composer Drag-And-Drop Attachments

Date: 2026-04-25
Mode: RALPLAN-DR short
Verdict: APPROVED by Planner, Architect, and Critic

## Requirements Summary

채팅 입력 UI는 그대로 유지하면서 파일 드래그앤드롭 첨부를 추가한다. 사용자가 파일을 composer 위로 드래그하면 점선 outline과 plus 표시가 보이고, drop하면 기존 파일 선택/붙여넣기와 같은 첨부 경로로 파일이 추가되어야 한다.

이번 범위는 실제 업로드 백엔드 연동이 아니라 현재 mock attachment 흐름에 드롭 입력을 연결하는 것이다.

## Codebase Evidence

- `packages/chat-ui/src/composer/UniversalMessageComposer.tsx:50-58` exposes `onFilesSelected?: (files: File[]) => void`.
- `packages/chat-ui/src/composer/UniversalMessageComposer.tsx:99-105` owns composer refs/state including file input, attachment refs, toast, and attachment state.
- `packages/chat-ui/src/composer/UniversalMessageComposer.tsx:129-145` centralizes file ingestion in `addFiles(files)`.
- `packages/chat-ui/src/composer/UniversalMessageComposer.tsx:121-127` and `147-153` already clean up image preview URLs.
- `packages/chat-ui/src/composer/UniversalMessageComposer.tsx:224` is the composer root wrapper.
- `packages/chat-ui/src/composer/UniversalMessageComposer.tsx:230` renders the attachment tray.
- `packages/chat-ui/src/composer/UniversalMessageComposer.tsx:236-241` renders the Lexical `ContentEditable`.
- `packages/chat-ui/src/composer/UniversalMessageComposer.tsx:259-263` routes pasted files through `PasteSanitizerPlugin onFilesPasted={addFiles}`.
- `packages/chat-ui/src/composer/UniversalMessageComposer.tsx:265-284` routes the hidden file input and paperclip button through `addFiles`.
- `packages/chat-ui/src/composer/UniversalMessageComposer.tsx:299-350` renders attachment chips and remove buttons.
- `apps/chat/frontend/src/features/composer/components/MessageComposer.tsx:39-50` consumes `UniversalMessageComposer` and logs `onFilesSelected`.
- `apps/chat/frontend/src/features/rooms/components/ChatSurface.tsx:65` renders the room composer.
- `apps/chat/frontend/src/features/threads/components/ThreadPanel.tsx:148-152` renders the same `MessageComposer` for thread replies.
- `packages/chat-ui/package.json:14-18` defines `build` and `typecheck`.
- `apps/chat/frontend/package.json:2` names the frontend package `chat-frontend`.
- `apps/chat/frontend/package.json:41-49` includes Vitest, Testing Library, and jsdom dependencies.
- `apps/chat/frontend/vitest.config.ts:7-10` configures Vitest with jsdom globals.

## RALPLAN-DR Summary

### Principles

1. Preserve the existing chat composer UI and attachment flow.
2. Add drag-and-drop at the shared composer layer so room and thread composers both benefit.
3. Reuse existing `addFiles(files)` attachment handling.
4. Guard drag behavior strictly to file drags only.
5. Add focused regression coverage for drag/drop behavior.

### Decision Drivers

1. Minimal behavioral risk: paste and paperclip already converge through `addFiles(files)`.
2. Shared component leverage: `UniversalMessageComposer` owns attachment state and is used by the chat app composer.
3. Regression protection: chat frontend has Vitest/jsdom/testing-library support for component-level tests.

### Viable Options

#### Option A: Implement drag/drop inside `UniversalMessageComposer`

Pros:
- Reuses `onFilesSelected`, attachment state, previews, attachment tray, and toast behavior.
- Works for room and thread composers without app-level duplication.
- Keeps all attachment lifecycle behavior in one component.

Cons:
- Broadens file-drop behavior to all `UniversalMessageComposer` consumers.
- Requires strict guards so non-file drags and Lexical editing are not disturbed.

#### Option B: Implement drag/drop in the chat frontend wrapper

Pros:
- Keeps the behavior app-local.
- Avoids changing the shared component's default behavior.

Cons:
- `MessageComposer` cannot access internal `addFiles`.
- Would likely duplicate attachment state or require a new imperative API.
- Thread and room composer parity would be easier to miss.

### Decision

Choose Option A. The feature is an input affordance for a shared composer that already owns file ingestion, preview creation, cleanup, and attachment UI.

## Implementation Plan

### 1. Add explicit file-drag guards and drag state

File: `packages/chat-ui/src/composer/UniversalMessageComposer.tsx`

Work:
- Add `isDraggingFiles` state near the existing state block.
- Add `dragDepthRef = useRef(0)` to prevent child hover flicker.
- Add `isFileDrag(dataTransfer: DataTransfer | null): boolean`, returning true only when `dataTransfer?.types.includes("Files")`.

Acceptance criteria:
- Non-file drags do not set drag state.
- Moving across nested composer children does not flicker the indicator.
- Drag state resets on drop, drag leave, and drag end.

### 2. Attach guarded drag/drop handlers to the composer root

File: `packages/chat-ui/src/composer/UniversalMessageComposer.tsx`

Work:
- Attach `onDragEnter`, `onDragOver`, `onDragLeave`, and `onDrop` to the root wrapper around line 224.
- Only when `isFileDrag(event.dataTransfer)` is true:
  - call `event.preventDefault()`;
  - set `event.dataTransfer.dropEffect = "copy"`;
  - update drag depth;
  - on drop, convert `event.dataTransfer.files` to `File[]`;
  - call `addFiles(files)` only when the list is non-empty.
- Ignore empty drops and non-file drops.

Acceptance criteria:
- Dropping one or more files shows them in the attachment tray.
- `onFilesSelected` fires through the existing `addFiles` path.
- Empty and non-file drops do not modify attachments.
- Lexical editing in the `ContentEditable` remains usable.

### 3. Add dashed-outline and plus-symbol affordance

File: `packages/chat-ui/src/composer/UniversalMessageComposer.tsx`

Work:
- Make the composer root `relative` if needed.
- Add active drag styling that creates a dashed outline without layout shift.
- Add a plus indicator while `isDraggingFiles` is true.
- Use `pointer-events-none` on the visual overlay.

Acceptance criteria:
- File drag-over shows a dashed outline and plus symbol.
- Existing composer contents remain visible and do not reflow.
- The indicator disappears after drop or after leaving the composer.
- The overlay does not block drop events.

### 4. Add focused drag/drop regression tests

Preferred file: `apps/chat/frontend/src/features/composer/components/MessageComposer.test.tsx`

Work:
- Test with the real shared composer through `MessageComposer` when feasible.
- If wrapper testing is awkward because of Lexical setup, test `UniversalMessageComposer` from the chat frontend Vitest environment.
- Cover one file-drop case and one non-file drag/drop case.

Acceptance criteria:
- A dropped `File` becomes visible as an attachment, or otherwise produces the existing observable attachment UI state.
- A non-file drag/drop does not attach a file and does not show upload state.
- Tests run under `chat-frontend` Vitest.

### 5. Verify integration in room and thread composers

Files:
- `apps/chat/frontend/src/features/composer/components/MessageComposer.tsx`
- `apps/chat/frontend/src/features/rooms/components/ChatSurface.tsx`
- `apps/chat/frontend/src/features/threads/components/ThreadPanel.tsx`

Work:
- Avoid app-level duplicate drag/drop handling.
- Keep wrapper props unchanged unless type integration reveals a necessary adjustment.
- Verify both room composer and thread reply composer inherit the shared behavior.

Acceptance criteria:
- Room composer accepts dropped files.
- Thread reply composer accepts dropped files.
- Existing `onFilesSelected` logging receives dropped files.
- Existing send behavior is unchanged.

## Overall Acceptance Criteria

- File drag-over shows a dashed outline and plus symbol on the composer.
- Dropping files attaches them through existing composer behavior.
- Pasting files still works.
- Paperclip file selection still works.
- Non-file drag/drop does not show upload styling or attach anything.
- Drag/drop tests cover both file and non-file cases.
- `@dashway/chat-ui` typecheck/build pass.
- `chat-frontend` typecheck/test pass.

## Risks And Mitigations

- Risk: shared behavior affects other composer consumers.
  Mitigation: gate all drag logic behind `dataTransfer.types.includes("Files")`; add a future disable prop only if a real consumer needs it.
- Risk: drag leave flickers over children.
  Mitigation: track drag depth with a ref and reset on drop/end.
- Risk: overlay blocks drop events.
  Mitigation: use `pointer-events-none` and root-level handlers.
- Risk: non-file drags trigger upload UI.
  Mitigation: ignore all non-file drags completely.
- Risk: attachment lifecycle diverges.
  Mitigation: route dropped files only through existing `addFiles(files)`.
- Risk: visual outline shifts layout.
  Mitigation: use outline, ring, or absolute overlay styles rather than changing box dimensions.

## Verification Steps

Run from repo root:

```sh
pnpm --filter @dashway/chat-ui typecheck
pnpm --filter @dashway/chat-ui build
pnpm --filter chat-frontend typecheck
pnpm --filter chat-frontend test
```

Manual checks:

- Drag a file over the room composer and confirm dashed outline plus symbol appears.
- Drop the file and confirm it appears in the attachment tray.
- Repeat with multiple files, an image file, and a non-image file.
- Drag selected text or another non-file payload and confirm upload UI does not appear.
- Repeat the same file-drop check in the thread reply composer.
- Confirm paste and paperclip attachment still work.

## ADR

### Decision

Implement drag-and-drop file attachments inside `UniversalMessageComposer`, guarded by `isFileDrag(event.dataTransfer)` and routed through the existing `addFiles(files)` path.

### Drivers

1. Existing attachment ownership and lifecycle are already in the shared composer.
2. The requested UI affordance is scoped to the composer surface.
3. Regression tests can be added through the chat frontend Vitest/jsdom/testing-library setup.

### Alternatives Considered

- Option A: Shared composer implementation. Chosen because it reuses existing attachment behavior and avoids duplicate upload logic.
- Option B: Chat frontend wrapper implementation. Rejected because the wrapper does not own internal attachment state and would require duplication or new APIs.

### Why Chosen

`UniversalMessageComposer.tsx:129-145` already provides the correct upload entry point. Adding guarded root-level drag/drop behavior around `UniversalMessageComposer.tsx:224` gives file drops the same behavior as paste and paperclip selection with minimal new surface area.

### Consequences

- All `UniversalMessageComposer` consumers receive file drag/drop support.
- Behavior is intentionally conservative: non-file drags are ignored.
- Tests are part of the implementation scope rather than a follow-up.
- A future opt-out prop can be added if another shared composer consumer needs different drag/drop behavior.

### Follow-ups

- Add file type or size validation once backend upload constraints are defined.
- Replace the mock upload toast when real upload lifecycle integration exists.

## Consensus Review Notes

- Planner produced the initial RALPLAN-DR short plan.
- Architect first returned ITERATE: fix the frontend package filter, make file-drag guards explicit, and move drag/drop tests into implementation scope.
- Planner revised the plan accordingly.
- Architect re-reviewed and APPROVED.
- Critic returned OKAY after verifying file references, option consistency, risks, and verification steps.

## Applied Improvements

- Corrected verification commands to use `chat-frontend`.
- Added explicit `isFileDrag` guard requirements and event cancellation boundaries.
- Added focused regression tests as required scope.
- Added the shared behavior tradeoff and mitigation.
- Added thread reply composer integration to the verification scope.
