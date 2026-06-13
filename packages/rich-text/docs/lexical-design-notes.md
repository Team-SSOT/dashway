# Lexical 인터페이스 설계 노트

> chat composer의 리치텍스트(Lexical) 인터페이스를 만들면서 고려했던 결정들을
> 한곳에 모은 문서. "왜 이렇게 했나"를 코드가 아니라 의도 수준에서 남긴다.
> 관련 코드: `@dashway/rich-text`, `apps/chat/frontend/src/features/composer/ui/composer/`

---

## 0. 큰 그림 — 3개의 경로(path)를 분리

리치텍스트를 다루는 상황은 성능 규칙이 서로 다르다. 한 덩어리로 보면 안 되고
셋으로 쪼갠 뒤 각각 다른 규칙을 적용했다.

| 경로 | 언제 | 성능 규칙 |
|------|------|-----------|
| ① **Load/Save** | 전송·DB 읽기 | 전체 트리 순회 **허용** (드물게 1회) |
| ② **Editing** | 키 입력마다 | 전체 순회 **금지**, 증분(P1) |
| ③ **Derive/Read** | 미리보기·검색 렌더 | 렌더 1패스 |

이 분리가 아래 모든 마운트/언마운트·추적 결정의 뿌리다. "편집 경로냐 아니냐"가
판단 기준이 된다.

---

## 1. 멘션을 `DecoratorNode`로 — 왜 컴포넌트 마운트/언마운트인가

멘션 칩의 핵심 요구사항:

- **원자적(atomic)**: `@홍길동`은 한 글자씩 지워지면 안 되고 통째로 하나의 단위.
- **편집 불가(non-editable)**: 칩 안쪽에 커서가 들어가 텍스트가 쪼개지면 안 된다.
- **인라인**: 문장 흐름 안에 글자처럼 박힌다.
- **React 칩으로 렌더**: 타입별 색상·아이콘·툴팁 등 UI가 붙는다.

Lexical에서 이 네 가지를 동시에 만족하는 건 `DecoratorNode`다.

```
TextNode          → 글자 단위로 편집/분할됨        ✗ (원자성 깨짐)
ElementNode       → 자식을 갖는 블록/인라인 컨테이너 ✗ (내부 편집 가능)
DecoratorNode     → Lexical 트리에 "구멍"을 뚫고     ✓
                    그 자리에 React를 마운트
```

### 마운트/언마운트 모델이 의미하는 것

`DecoratorNode.decorate()`가 반환하는 React 엘리먼트를, Lexical이 해당 노드의
DOM 자리에 **마운트**한다. 그래서 다음을 의식적으로 설계했다.

- **`createDOM`은 빈 껍데기만**: `<span style="display:inline">`만 만들고
  실제 내용은 `decorate()`의 React가 채운다. DOM 호스트와 React 콘텐츠를 분리.
  → `MentionNode.createDOM` / `EmojiNode.createDOM` 참고.
- **`updateDOM`은 항상 `false`**: 호스트 `<span>`은 절대 안 바뀐다.
  내용 변경은 React 재렌더가 책임지므로 Lexical이 DOM을 건드릴 이유가 없다.
  → 불필요한 reconcile을 원천 차단.
- **`clone`이 `__key`를 보존**: 같은 노드의 재생성 시 키를 유지해야 React가
  언마운트→재마운트가 아니라 **업데이트**로 인식한다. 키가 흔들리면 칩이
  깜빡이고 포커스/IME가 깨진다.
- **노드 데이터는 `__target` 한 덩어리**: `person | document | issue | team | app`
  **다형 멘션**을 하나의 노드 클래스로 표현. 타입별로 노드를 나누지 않은 이유는
  직렬화 포맷과 트래커를 단일화하기 위해서.

### 언마운트 시점의 함정

칩(DecoratorNode)이 트리에서 사라질 때 React 컴포넌트도 언마운트된다. 이때
"멘션이 지워졌다"는 사실을 **누가, 언제 아느냐**가 ②편집 경로의 핵심 문제 →
다음 섹션의 트래커가 답한다.

---

## 2. 멘션 추적 — "키 입력마다 트리를 걷지 않는다" (P1)

### 순진한 방식의 함정

"지금 문서에 멘션이 뭐가 있나"를 알려면 트리를 순회하면 된다. 하지만 이걸
**키 입력마다** 하면 긴 문서(N 노드)에서 매 타//이핑이 `O(N)`, 세션 전체가
`O(K·N)` — 성능 절벽.

### 채택: `registerMutationListener` 기반 증분 추적

Lexical의 mutation listener는 **변경된 `MentionNode`만** 통지한다. 멘션과
무관한 글자를 쳤으면 리스너가 **아예 안 깨어난다(비용 0)**.

```
타이핑 ──▶ Lexical reconcile(dirty 노드만)
            │
            ├─ 이번 변경에 MentionNode 포함?
            │     ├─ destroyed  → map.delete(key)          ← 언마운트 감지
            │     └─ created/updated → read 1개 노드 → map.set
            │                                          O(ΔM) ≈ O(1)
            └─ 무관한 입력이면 listener 미발화           비용 0
```

- 상태는 `Map<NodeKey, MentionRef>`. 트리가 아니라 **멘션만 담긴 맵**이라
  문서 크기 N과 무관.
- `MentionRef = Pick<MentionTarget, 'id'|'type'|'label'>` — 추적/목록용
  **경량 참조**. 렌더·검색용 풀 `MentionTarget`과 의도적으로 구분(불필요한
  필드를 매 통지마다 복사하지 않음).
- 변경 있을 때만 `notify` → 구독자에게 `O(M)` 배열 1회 전달.

### 생명주기(마운트/언마운트) 관리 — `useMentionTracker`

React 훅이 트래커의 생명주기를 에디터 인스턴스에 묶는다.

```ts
useEffect(() => {
  const tracker = createMentionTracker(editor)
  setRefs(tracker.values())          // 등록 시점에 기존 멘션으로 seed
  const unsubscribe = tracker.subscribe(setRefs)
  return () => { unsubscribe(); tracker.dispose() }   // 언마운트/에디터 교체 시 정리
}, [editor])
```

여기서 고려한 것:

- **seed**: mutation listener는 `skipInitialization=false`로 등록해, **이미
  로드된 문서의 멘션**들이 등록 즉시 맵에 채워진다. 그래서 마운트 첫 커밋부터
  올바른 칩 목록이 나온다(드래프트 복원 시 빈 목록이었다가 깜빡이는 문제 방지).
- **dispose**: `unregister()` + 구독자 clear + 맵 clear. 에디터 인스턴스가
  바뀌거나(채널 전환 등) 컴포넌트가 언마운트되면 리스너가 새어 나가지 않도록
  반드시 해제. 이게 빠지면 죽은 에디터에 listener가 남아 메모리 누수.

### `extract`가 트래커를 재활용

미리보기/검색 렌더(③경로)에서 멘션 목록이 필요할 때, 살아있는 트래커가 있으면
`values()`(`O(M)`)로 읽어 **두 번째 전체 순회를 건너뛴다**. 트래커가 없으면
(load 시점) full-walk로 정확성을 택한다 — 경로별 규칙의 일관된 적용.

---

## 3. Typeahead(@ 자동완성) — 별도 React 플러그인으로 분리

멘션 노드(데이터/렌더)와 **멘션을 고르는 UI**(typeahead)를 분리했다.
`MentionTypeaheadPlugin`은 Lexical 노드가 아니라 평범한 React 컴포넌트로,
`isOpen`이 아니면 `null`을 반환해 **picker 자체를 마운트/언마운트**한다.

설계 시 고려한 것들:

### (1) 캡처 모델 — "어느 텍스트 노드의 어느 범위에 @가 있나"

`registerUpdateListener`로 매 변경 시 캐럿 앞 텍스트를 정규식으로 검사해
`MentionCapturedRange`(textNodeKey + start/end offset + tokenText)를 잡아둔다.
삽입 시점에 이 캡처가 **여전히 유효한지** 재확인(`tokenText` 일치 + `@`로 시작)
후에만 치환 → 사이에 문서가 바뀌어 생기는 **stale range** 안전장치.

### (2) 키보드 명령 우선순위 — `COMMAND_PRIORITY_CRITICAL`

picker가 열렸을 때 ↑/↓/Enter/Esc는 에디터의 기본 동작(줄바꿈·전송 등)보다
**먼저** 가로채야 한다. 그래서 `KEY_*_COMMAND`를 `CRITICAL` 우선순위로 등록하고,
`isOpen && items.length>0`일 때만 `true`(소비)를 반환. picker가 닫혀 있으면
`false`로 흘려보내 composer의 Enter=전송과 충돌하지 않게 했다.

### (3) IME(한글) 합성 중에는 무시

`event.isComposing` / `isComposing` 체크. 한글 조합 중 Enter는 "글자 확정"이지
"선택/전송"이 아니다. 이걸 빼면 한글 멘션 검색 중 Enter가 오작동.
→ composer 전송 로직도 같은 이유로 `composingRef`(아래 4번)를 본다.

### (4) 디바운스 + 경쟁 요청 가드

검색은 120ms 디바운스. 각 요청에 `requestId`를 부여해 **늦게 도착한 옛 응답이
새 결과를 덮어쓰지 못하게** 한다(`requestId !== requestIdRef.current면 무시`).

### (5) 포커스 줄다리기 — `preserveForInputRef`

picker 안에 검색 `<input>`이 있다. 거기에 포커스가 가면 에디터 selection이
풀려 updateListener가 picker를 닫으려 한다. `preserveForInputRef`/
`document.activeElement` 체크로 **input에 포커스가 있는 동안엔 닫지 않는다**.
blur 시에도 `relatedTarget`이 picker 내부면 유지.

### (6) 검색 소스 주입(P3)

플러그인은 `mentionSearch: (query) => Promise<MentionTarget[]>`를 **주입받기만**
한다. mock directory든 live context-api든 호출부 한 줄 교체로 스왑.
패키지는 `fromSearchFn` 어댑터만 제공하고 fetch 구현을 갖지 않는다.

---

## 4. 멘션 삽입(insert) — 텍스트 노드 분할 전략

`insertMentionAtCapturedRange` / `replaceTextNodeRangeWithMention`에서 고려한 것:

- **`@쿼리` 토큰만 정확히 치환**: 텍스트 노드를 `splitText`로 쪼개 `@홍`만
  들어낸 자리에 `MentionNode`를 `replace`. 앞뒤 텍스트는 보존.
- **칩 뒤에 공백 1개 자동 삽입 후 커서 이동**: 칩 바로 뒤에 캐럿이 붙으면
  사용자가 계속 타이핑할 때 칩에 글자가 먹히는 느낌이 든다. spacer 텍스트
  노드를 넣고 `select()`로 그 뒤로 커서를 보낸다.
- **방어적 경계 검사**: offset이 음수/역전/범위 초과면 `false` 반환하고 no-op.
  캡처가 stale이면 조용히 실패(`console.warn`)하고 picker만 닫는다.
- **fallback 삽입 경로**: 선택이 RangeSelection이 아니거나 텍스트 노드가
  아닐 때는 `$insertNodes([mention, ' '])`로 현재 위치에 그냥 꽂는다.

---

## 5. 같은 패턴의 재사용 — `EmojiNode`

`:smile:` → 😄 변환도 같은 결정을 공유한다.

- 역시 **`DecoratorNode`**(원자적·인라인·React 렌더). 멘션과 동일한
  createDOM 껍데기 / `updateDOM:false` / `isInline` / `isKeyboardSelectable` 패턴.
- 변환은 **`registerNodeTransform(TextNode)`** 로 한다. 사용자가 `:smile:`을
  완성하는 순간 transform이 텍스트 노드를 쪼개 `EmojiNode`로 치환.
  멘션의 typeahead와 달리 **확정형 토큰**이라 picker가 필요 없다.
- 한 번에 첫 매치 하나만 치환하고 빠진다 — transform이 재실행되며 나머지를
  순차 처리(Lexical transform의 안전한 수렴 패턴).

> 교훈: "원자적 인라인 + React 렌더" 요구가 또 나오면 DecoratorNode 패턴을
> 복제. 노드 클래스 4종(Mention/Emoji/…)이 같은 골격을 공유하는 이유.

---

## 6. 에디터 부트스트랩과 생명주기

`UniversalMessageComposer`에서의 결정:

- **`key={composerId}` 로 에디터 인스턴스 격리**: 채널/스레드가 바뀌면
  `LexicalComposer`를 통째로 리마운트. 에디터 상태가 채널 간에 새지 않는다.
  트래커 훅의 `[editor]` 의존성도 이 교체에 맞춰 정리/재구성된다.
- **드래프트 복원은 `initialStateRef`로 1회만**: 첫 마운트에서
  `parseEditorState`로 복원하되, 이후 prop 변경엔 반응하지 않게 ref로 고정
  (복원이 매 렌더마다 덮어쓰는 사고 방지). 실패 시 `console.warn` 후 빈 에디터.
- **전송 후 정리**: `$getRoot().clear()` + `CLEAR_HISTORY_COMMAND` +
  드래프트 null. 히스토리까지 비워야 전송 직후 Ctrl+Z로 옛 메시지가
  되살아나지 않는다.
- **첨부 미리보기 URL 누수 방지**: `URL.createObjectURL`로 만든 미리보기는
  제거/언마운트 시 `revokeObjectURL`. `attachmentsRef`로 언마운트 클린업에서
  최신 목록에 접근.

---

## 7. IME 가드 — 한글 입력 정합성

`ImeGuardPlugin`이 루트 엘리먼트의 `compositionstart/end`를 듣고
`composingRef`를 토글. composer의 Enter 핸들러는 **합성 중이면 전송을 막는다**
(`if (composingRef.current) return true`).

왜 필요한가: 한글은 자모를 조합해 글자를 만든다. 조합 도중의 Enter는 "글자
확정"이지 "전송"이 아니다. 이 가드가 없으면 한글 메시지 끝 글자가 잘리거나
조합 중 전송되는 버그. **한글 제품이라 load-bearing.**

---

## 8. 붙여넣기 정화 — `PasteSanitizerPlugin`

신뢰할 수 없는 클립보드 입력을 노드 화이트리스트 안으로 가둔다.

- **파일/이미지 붙여넣기**: 에디터에 박지 않고 첨부 트레이로 우회
  (`onFilesPasted`). 이미지가 본문 노드로 들어오는 걸 차단.
- **글자 수 상한 50,000**: 초과 붙여넣기는 막고 토스트. 업데이트 리스너로도
  본문 길이를 상시 감시.
- **HTML → 노드 변환은 `$generateNodesFromDOM`**: 변환 실패 시 plain text로
  graceful fallback. (허용 노드 화이트리스트는 `@dashway/rich-text`의
  `validate`가 load/save 경로에서 한 번 더 보장.)

---

## 9. 직렬화 / 검증 — 경로별 다른 규칙(요약)

편집 경로가 아닌 ①Load/Save는 **정확성 우선, 순회 허용**.

- **`schemaVersion` 봉투**: `RichTextDocument = { schemaVersion, root }`.
  `deserialize`가 버전 불일치를 `throw`(조용한 파싱 사고 방지).
- **size는 `.length`가 아니라 UTF-8 바이트(`TextEncoder`)**: UTF-16 길이는
  한글/CJK를 ~3배 적게 센다. 한글 문서가 실제 750KB인데 통과하는 사고 방지.
- **depth ≤ 16 / 노드 화이트리스트**: 병적 중첩·`table` 같은 비허용 노드 거부.
- **plain text 추출의 fidelity loss는 문서화된 의도**: `lexicalToplain`에서
  멘션은 `@label`로 떨어지고 `targetId`는 평문에서 소실(서버 측 멘션 해석은
  V1.2+). 알면서 택한 손실.

---

## 한눈에 보는 결정 표

| 고려사항 | 결정 | 이유 |
|----------|------|------|
| 멘션/이모지 노드 종류 | `DecoratorNode` | 원자적·인라인·React 마운트 |
| `createDOM`/`updateDOM` | 빈 span + `false` | DOM 호스트와 React 콘텐츠 분리 |
| `clone` 키 보존 | `__key` 유지 | 언마운트→재마운트 대신 업데이트 |
| 편집 중 멘션 추적 | mutation listener 증분 | 키 입력당 `O(ΔM)`, 트리 순회 금지 |
| 트래커 생명주기 | `useEffect` seed+dispose | 에디터 교체/언마운트 시 누수 방지 |
| typeahead | 별도 React 플러그인 | 노드와 선택 UI 분리, 조건부 마운트 |
| 키 명령 | `CRITICAL` + 조건부 소비 | Enter=전송과 충돌 회피 |
| IME | `isComposing`/`composingRef` 가드 | 한글 조합 중 오작동 방지 |
| 검색 소스 | 주입(`mentionSearch`) | mock↔live 한 줄 스왑(P3) |
| 에디터 격리 | `key={composerId}` | 채널 간 상태 누수 차단 |
| size 측정 | UTF-8 바이트 | 한글 크기 정확 |

---

_관련 코드_
- `packages/rich-text/src/nodes/MentionNode.tsx`, `tracker.ts`, `react/useMentionTracker.ts`
- `apps/chat/frontend/src/features/composer/ui/composer/lexical/nodes/{MentionNode,EmojiNode}.tsx`
- `apps/chat/frontend/src/features/composer/ui/composer/lexical/plugins/{MentionTypeahead,ImeGuard,EmojiReplace,PasteSanitizer}*`
- `apps/chat/frontend/src/features/composer/ui/composer/mentionSearch/insertMention.ts`
- `apps/chat/frontend/src/features/composer/ui/composer/UniversalMessageComposer.tsx`
