# 채팅 UI 재사용성 및 웹 좌측 패널 제거 계획

날짜: 2026-04-25
상태: 사용자 정정사항 반영 완료

## 요구사항 요약

웹 채팅 앱은 좌측 패널 없이 채팅 화면을 보여줘야 한다. 단, 채팅방 내부의 기능인 메시지 목록, 작성기, 헤더, 스레드 패널, reply-in-thread 동작은 유지한다.

Electron 앱에서는 이미 shell이 좌측 패널과 앱 내비게이션을 담당하므로 Electron shell UI는 건드리지 않는다. 대신 웹 채팅의 본문 UI를 독립적이고 재사용 가능한 컴포넌트로 설계해 Electron의 iframe/remote app 환경에서도 같은 채팅 화면을 그대로 사용할 수 있게 한다.

## 원칙

1. 웹 standalone 채팅에서만 좌측 rail/sidebar를 제거한다.
2. 채팅방 내부 기능은 유지한다. 특히 스레드 UI와 thread route는 삭제하지 않는다.
3. Electron shell의 `GlobalRail`, `LocalSidebar`, `RightPanel`, grid layout은 수정하지 않는다.
4. 채팅 본문은 shell과 분리된 독립 컴포넌트로 둔다.
5. 내부 `roomId` 기반 라우팅과 데이터 모델은 유지한다.

## 결정

Phase 1에서는 `apps/chat/frontend`의 standalone 웹 shell에서 좌측 패널만 제거하고, 실제 채팅 화면을 재사용 가능한 컴포넌트 경계로 정리한다.

Electron 쪽은 기존처럼 remote app iframe을 표시하고, 좌측 패널은 Electron shell이 담당한다. 따라서 `apps/desktop/renderer/src/shell/layout/AppShell.tsx`, `shell.css`, `RemoteAppRoute.tsx` 같은 Electron shell 파일은 이번 범위에서 변경하지 않는다.

## 대상 파일

웹 채팅:

- `apps/chat/frontend/src/app/AppShell.tsx`
- `apps/chat/frontend/src/app/router.tsx`
- `apps/chat/frontend/src/features/rooms/components/RoomView.tsx`
- `apps/chat/frontend/src/features/rooms/components/RoomHeader.tsx`
- `apps/chat/frontend/src/features/messages/components/MessageList.tsx`
- `apps/chat/frontend/src/features/messages/components/MessageItem.tsx`
- `apps/chat/frontend/src/features/threads/components/ThreadPanel.tsx`
- `apps/chat/frontend/src/features/composer/components/MessageComposer.tsx`

Electron shell:

- 변경 대상 아님.
- 기존 shell 좌측 패널은 그대로 둔다.

## 구현 계획

### 1. 웹 AppShell에서 좌측 패널만 제거

현재 `apps/chat/frontend/src/app/AppShell.tsx`는 `GlobalRail`과 `ChannelSidebar`를 직접 렌더링한다. 이 두 영역만 standalone 웹 shell에서 제거한다.

작업:

- `GlobalRail` import 제거.
- `ChannelSidebar` import 제거.
- 두 `<aside>` 렌더링 제거.
- `<main>`이 전체 높이와 폭을 차지하도록 단순화.
- 기존 `min-w-[480px]`처럼 좁은 화면에서 불필요한 가로 overflow를 만드는 제약은 제거하거나 완화.

수용 기준:

- 웹에서 채팅 앱을 열면 좌측 rail/sidebar 없이 채팅 영역만 보인다.
- 채팅 본문은 전체 가용 폭을 사용한다.
- Electron shell 파일은 수정하지 않는다.

### 2. 채팅 본문을 재사용 가능한 컴포넌트 경계로 정리

`RoomView`는 현재 실제 채팅 화면의 중심이다. 이 역할을 명확히 해서 웹 standalone shell과 Electron remote app 모두 같은 본문을 사용할 수 있게 한다.

권장 구조:

- `RoomView`는 라우트 파라미터와 데이터 로딩을 담당하는 route-aware 컨테이너로 유지한다.
- 실제 채팅 레이아웃은 별도 컴포넌트로 분리한다. 예: `ChatRoomView`, `ChatConversation`, 또는 `ChatSurface`.
- 분리된 컴포넌트는 `room`, `roomId`, `messages`, `members`, `thread state`, `send handler` 같은 명시적 props를 받는다.
- 좌측 패널이나 Electron shell 상태에 의존하지 않는다.

수용 기준:

- 채팅 본문 컴포넌트는 standalone 웹 shell 없이도 렌더링 가능하다.
- Electron iframe 안에서도 같은 웹 채팅 UI가 그대로 사용된다.
- 컴포넌트 내부에 Electron shell 레이아웃 가정이 없다.

### 3. 스레드 기능 유지

스레드는 채팅방 내부 기능이므로 유지한다.

유지할 것:

- `/c/:roomId/thread/:msgId` route.
- `RoomView`의 `msgId` 기반 `ThreadPanel` 렌더링.
- `MessageItem`의 reply count 버튼.
- `MessageHoverToolbar`의 `Reply in thread` 액션.
- `ThreadPanel`, `ThreadReplyList`, `useThreadReplies`, `useRealtimeThread`.

수용 기준:

- 메시지에서 thread를 열 수 있다.
- thread panel은 기존처럼 채팅 화면 오른쪽에 표시된다.
- thread route로 직접 접근해도 기존 동작이 유지된다.

### 4. 채널/방 내비게이션은 웹 좌측 패널에서만 제거

이번 변경의 핵심은 “좌측 패널 제거”이지 “채팅방 내부 모델 삭제”가 아니다.

작업:

- `ChannelSidebar`와 `GlobalRail`은 `AppShell`에서 더 이상 렌더하지 않는다.
- `CreateChannelDialog`는 좌측 패널에서 접근하던 기능이므로 standalone 웹 첫 화면에서 노출되지 않는다.
- 내부 `rooms` hooks, `roomId`, `useActiveRoom`, `useRooms`, `useRoomMessages`는 유지한다.

수용 기준:

- 웹 standalone 화면에는 좌측 채널 목록이 없다.
- 기존 room 기반 메시지 로딩은 유지된다.
- room/channel 데이터 모델을 급하게 rename하거나 삭제하지 않는다.

### 5. 라우팅은 최소 변경

기존 채팅방 URL과 thread URL을 유지한다.

작업:

- `/c/:roomId` 유지.
- `/c/:roomId/thread/:msgId` 유지.
- `/c` index가 필요하다면 기존 `EmptyRoom` 대신 기본 room으로 안내하거나 redirect할 수 있다. 이 부분은 좌측 패널 제거 후 빈 화면이 어색할 때만 최소 수정한다.
- `/`의 `LoginPlaceholder` 동작은 현재 제품 흐름과 충돌하지 않는 선에서만 수정한다.

수용 기준:

- 기존 deep link가 깨지지 않는다.
- thread deep link도 깨지지 않는다.
- 좌측 패널 제거와 무관한 라우팅 개편은 하지 않는다.

### 6. Electron shell은 변경하지 않음

Electron 앱에서는 shell이 좌측 패널을 구성할 예정이므로, 이번 작업은 Electron shell 레이아웃에 손대지 않는다.

명시적 비대상:

- `apps/desktop/renderer/src/shell/layout/AppShell.tsx`
- `apps/desktop/renderer/src/shared/styles/shell.css`
- `apps/desktop/renderer/src/shell/layout/GlobalRail.tsx`
- `apps/desktop/renderer/src/shell/layout/LocalSidebar.tsx`
- `apps/desktop/renderer/src/shell/routes/RemoteAppRoute.tsx`
- `apps/desktop/renderer/src/shell/layout/RemoteAppFrame.tsx`

수용 기준:

- Electron shell 좌측 패널은 기존대로 유지된다.
- Electron에서 chat remote app을 열면 iframe 내부에는 좌측 패널이 제거된 웹 채팅 UI가 보인다.
- shell full-bleed 조건, app detection helper, desktop shell CSS 변경은 하지 않는다.

## 검증 계획

필수 명령:

```sh
pnpm --filter chat-frontend typecheck
pnpm --filter chat-frontend test
pnpm --filter chat-frontend build
pnpm --filter @dashway/desktop typecheck
```

웹 수동 검증:

- 웹 채팅 앱에서 좌측 rail/sidebar가 보이지 않는다.
- 메시지 목록과 composer가 정상 동작한다.
- 메시지 hover toolbar에서 `Reply in thread`가 유지된다.
- reply count 버튼으로 thread panel을 열 수 있다.
- `/c/:roomId/thread/:msgId` 직접 접근이 유지된다.

Electron 수동 검증:

- Electron shell의 좌측 패널은 그대로 보인다.
- Electron iframe 안의 chat remote app에는 웹 AppShell의 좌측 패널이 보이지 않는다.
- Electron shell 레이아웃이 이번 변경으로 바뀌지 않는다.

## 위험 및 완화

- 위험: 좌측 패널 제거 과정에서 스레드 UI까지 제거될 수 있다.
  - 완화: `ThreadPanel`, `MessageHoverToolbar`, `MessageItem`의 thread 동작을 명시적으로 유지 대상으로 둔다.
- 위험: Electron shell과 웹 AppShell의 책임 경계가 섞일 수 있다.
  - 완화: Electron shell 파일은 비대상으로 명시하고, 웹 채팅 본문 컴포넌트만 독립화한다.
- 위험: 채팅 본문이 여전히 AppShell에 강하게 묶여 재사용성이 낮을 수 있다.
  - 완화: route-aware 컨테이너와 순수 chat surface 컴포넌트를 분리한다.

## ADR

Decision:

웹 standalone 채팅 앱에서는 좌측 패널을 제거한다. 채팅방 내부 기능, 특히 스레드 기능은 유지한다. Electron shell UI는 변경하지 않는다. 대신 웹 채팅 본문을 재사용 가능한 독립 컴포넌트로 정리한다.

Drivers:

- 사용자는 웹상에서 좌측 패널을 제외한 채팅 UI를 원한다.
- Electron 앱은 shell이 좌측 패널을 담당할 예정이므로 앱 내부에서 shell을 우회하거나 수정하면 책임 경계가 흐려진다.
- 스레드는 채팅 내부 기능이므로 제거 대상이 아니다.

Alternatives considered:

- Electron shell full-bleed 처리: shell 좌측 패널 책임과 충돌하므로 제외.
- thread UI 제거: 요구사항 정정에 따라 제외.
- room/channel 모델 전면 정리: 이번 범위보다 크므로 제외.

Consequences:

- 웹 standalone과 Electron iframe 내부의 chat UI는 같은 본문 컴포넌트를 공유할 수 있다.
- Electron shell은 기존 좌측 패널을 계속 제공한다.
- 내부 room/channel 용어는 유지되며, 필요하면 후속 작업에서 정리한다.

Follow-ups:

- `RoomView`에서 순수 chat surface 컴포넌트를 분리한 뒤 Storybook 또는 테스트 렌더를 추가한다.
- 좌측 패널 없는 웹 standalone 레이아웃을 모바일/좁은 폭에서 확인한다.
- Electron shell과 remote app 사이의 책임 경계를 문서화한다.
