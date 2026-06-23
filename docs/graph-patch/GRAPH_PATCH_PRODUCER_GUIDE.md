# Dashway Graph Patch Producer Guide

## 이 문서는 누구를 위한 문서인가

Dashway 안에서 새로운 서비스를 만들거나 기존 서비스에 graph 연동을 붙이는 개발자를 위한 문서다.

서비스 개발자는 Neo4j Cypher를 직접 만들지 않는다. 서비스에서 일어난 일을 보고 이 문서의 `Graph Patch` 메시지를 만들어 큐에 넣으면 된다. Dashway graph consumer가 그 메시지를 파싱해서 Neo4j에 저장한다.

```text
Service event
  -> Graph Patch JSON 생성
  -> Queue publish
  -> dashway graph consumer
  -> Neo4j 저장
```

## 서비스가 만들어야 하는 것

서비스는 이벤트가 발생할 때 아래 형태의 JSON 메시지를 만든다.

```json
{
  "messageType": "dashway.graph.patch.v1",
  "patchId": "patch-chat-message-101-v1",
  "idempotencyKey": "chat:message:101:v1",
  "sourceService": "chat",
  "workspaceId": "workspace_default",
  "occurredAt": "2026-05-24T10:30:00Z",
  "schemaVersion": "2026-05",
  "operations": [],
  "provenance": {
    "producer": "dashway-chat",
    "producerVersion": "0.1.0",
    "trigger": "chat.message.created"
  }
}
```

필수 필드:

- `messageType`: 항상 `dashway.graph.patch.v1`
- `patchId`: 이 graph patch 메시지의 고유 id
- `idempotencyKey`: 같은 이벤트가 여러 번 발행되어도 중복 저장되지 않게 하는 키
- `sourceService`: 메시지를 만든 서비스 이름
- `workspaceId`: workspace/tenant id
- `occurredAt`: 원 이벤트가 발생한 시각
- `schemaVersion`: graph patch 문법 버전
- `operations`: Neo4j에 반영할 node/relationship 목록

## Operation 종류

처음에는 두 가지만 쓴다.

```text
upsertNode
upsertRelationship
```

서비스는 삭제 쿼리나 raw Cypher를 만들면 안 된다.

## Node 만들기

서비스가 어떤 대상을 그래프에 저장하려면 `upsertNode`를 만든다.

```json
{
  "op": "upsertNode",
  "alias": "message",
  "nodeType": "ChatMessage",
  "id": "chat-message:101",
  "properties": {
    "messageId": 101,
    "roomId": "room-1",
    "content": "안녕하세요 @Jin",
    "createdAt": "2026-05-24T10:30:00Z"
  }
}
```

필드 설명:

- `alias`: 같은 patch 안에서 relationship이 이 node를 가리킬 때 쓰는 임시 이름
- `nodeType`: 만들 node 종류
- `id`: Dashway 전체에서 안정적인 node id
- `properties`: Neo4j에 저장할 값

id는 항상 같은 원본 객체에서 같은 값이 나와야 한다.

좋은 id:

```text
member:12
chat-message:101
chat-room:8e31af49-33e5-4f8b-9fd7-f50f7e2f2b23
calendar-event:workspace_default:evt_123
document:notion:workspace_default:page_456
```

피해야 할 id:

```text
jin@example.com
Jin
온보딩 회의
```

이메일, 이름, 제목처럼 바뀔 수 있거나 민감한 값은 id로 쓰지 않는다.

## Relationship 만들기

두 node 사이 관계를 만들려면 `upsertRelationship`을 만든다.

```json
{
  "op": "upsertRelationship",
  "from": "sender",
  "relationshipType": "SENT",
  "to": "message",
  "properties": {
    "at": "2026-05-24T10:30:00Z"
  }
}
```

`from`, `to`는 같은 patch 안의 `alias`를 쓸 수 있다.

기존 node를 직접 가리켜야 하면 object reference를 쓴다.

```json
{
  "op": "upsertRelationship",
  "from": "message",
  "relationshipType": "MENTIONS",
  "to": {
    "nodeType": "Person",
    "id": "member:12"
  },
  "properties": {
    "displayText": "@Jin"
  }
}
```

relationship은 방향이 있다.

```text
Person -[:SENT]-> ChatMessage
ChatMessage -[:MENTIONS]-> Person
ChatMessage -[:ABOUT]-> Concept
Task -[:ASSIGNED_TO]-> Person
```

방향을 뒤집으면 의미가 달라지므로 문서에 정해진 방향을 따라야 한다.

## 어떤 nodeType을 써야 하나

먼저 core node type에 매핑한다.

| 상황 | nodeType |
| --- | --- |
| 사람, 멤버, 사용자 | `Person` |
| 채팅방 | `ChatRoom` |
| 채팅 메시지 | `ChatMessage` |
| 문서, 페이지, RFC, PRD | `Document` |
| 이슈, 티켓, 작업 항목 | `Issue` |
| PR | `PullRequest` |
| 커밋 | `Commit` |
| 저장소 | `Repo` |
| 파일 | `File` |
| 기능, 주제, 시스템, 고객 이슈 | `Concept` |
| 할 일, 액션 아이템 | `Task` |
| 결정, 합의, 정책 | `Decision` |
| 애매한 외부 객체 | `ExternalObject` |

새로운 개념이 반드시 필요하면 바로 임의 label을 만들지 말고 `Graph Extension Manifest`를 먼저 추가한다.

예:

```text
CalendarEvent
Meeting
EmailMessage
Transcript
```

Manifest 없이 새 `nodeType`을 보내면 consumer가 완전히 버리지는 않는다. 대신 `ExternalObject`로 격리 저장한다.

```text
Unknown nodeType
  -> ExternalObject
  -> searchable = false
  -> graphVisibility = quarantined
  -> manifest 등록 전까지 기본 검색/LLM evidence pack에서 제외
```

즉 개발 중에는 새 node를 일단 보낼 수 있다. 하지만 정식 검색과 조회에 포함하려면 manifest를 등록해야 한다.

반대로 알 수 없는 `relationshipType`은 Neo4j graph edge로 바로 저장하지 않는다. relationship은 의미와 방향이 중요하기 때문에, manifest 없이 들어온 관계는 검색 가능한 관계로 연결하지 않고 pending intent로 격리 보관한다.

```text
Unknown relationshipType
  -> GraphRelationshipIntent
  -> searchable = false
  -> graphVisibility = quarantined
  -> manifest 등록 후 조건을 통과하면 정식 relationship으로 승격
```

## 어떤 relationshipType을 써야 하나

가능하면 아래 core relationship을 쓴다.

| 의미 | relationshipType |
| --- | --- |
| 사람이 메시지/문서를 작성함 | `SENT`, `AUTHORED` |
| 사람이 문서를 수정함 | `EDITED` |
| 메시지가 방 안에 있음 | `IN_ROOM` |
| 메시지가 채널 안에 있음 | `IN_CHANNEL` |
| 이슈/PR이 repo에 속함 | `IN_REPO` |
| 사람이 방에 속함 | `MEMBER_OF` |
| 메시지 수신자 | `TO` |
| 답글/스레드 | `REPLY_TO` |
| 멘션 | `MENTIONS` |
| 링크/참조 | `REFERENCES` |
| 어떤 개념에 관한 것 | `ABOUT` |
| 문서가 chunk를 가짐 | `HAS_CHUNK` |
| 메시지가 task를 제안함 | `PROPOSES` |
| task 담당자 | `ASSIGNED_TO` |
| 사람이 결정을 함 | `MADE` |
| 결정의 근거 | `SUPPORTED_BY` |
| 이슈/작업이 막힘 | `BLOCKED_BY` |
| 해결함 | `RESOLVES` |
| 구현함 | `IMPLEMENTS` |
| 느슨한 관련 | `RELATED_TO` |

## Property 규칙

property 값은 아래 타입만 허용한다.

- string
- number
- boolean
- string array
- number array
- boolean array

허용:

```json
{
  "title": "Onboarding Flow",
  "score": 0.92,
  "tags": ["onboarding", "activation"],
  "isPublic": true
}
```

금지:

```json
{
  "author": {
    "id": 12,
    "name": "Jin"
  }
}
```

중첩 object나 큰 원문은 따로 저장하고 reference만 보낸다.

```json
{
  "rawRef": "postgres:chat_message:101"
}
```

## 예시: 채팅 메시지 + 멘션

채팅 서비스에서 아래 메시지가 생성되었다고 하자.

```text
member 7이 room 1에 "@Jin 온보딩 플로우 확인 부탁해요"를 보냄
@Jin은 member 12를 가리킴
```

서비스는 이런 Graph Patch를 큐에 넣는다.

```json
{
  "messageType": "dashway.graph.patch.v1",
  "patchId": "patch-chat-message-101-v1",
  "idempotencyKey": "chat:message:101:v1",
  "sourceService": "chat",
  "workspaceId": "workspace_default",
  "occurredAt": "2026-05-24T10:30:00Z",
  "schemaVersion": "2026-05",
  "operations": [
    {
      "op": "upsertNode",
      "alias": "sender",
      "nodeType": "Person",
      "id": "member:7",
      "properties": {
        "memberId": 7
      }
    },
    {
      "op": "upsertNode",
      "alias": "mentioned",
      "nodeType": "Person",
      "id": "member:12",
      "properties": {
        "memberId": 12
      }
    },
    {
      "op": "upsertNode",
      "alias": "room",
      "nodeType": "ChatRoom",
      "id": "chat-room:room-1",
      "properties": {
        "roomId": "room-1",
        "type": "GROUP",
        "title": "Product"
      }
    },
    {
      "op": "upsertNode",
      "alias": "message",
      "nodeType": "ChatMessage",
      "id": "chat-message:101",
      "properties": {
        "messageId": 101,
        "roomId": "room-1",
        "content": "@Jin 온보딩 플로우 확인 부탁해요",
        "createdAt": "2026-05-24T10:30:00Z"
      }
    },
    {
      "op": "upsertRelationship",
      "from": "sender",
      "relationshipType": "SENT",
      "to": "message",
      "properties": {
        "at": "2026-05-24T10:30:00Z"
      }
    },
    {
      "op": "upsertRelationship",
      "from": "message",
      "relationshipType": "IN_ROOM",
      "to": "room",
      "properties": {}
    },
    {
      "op": "upsertRelationship",
      "from": "message",
      "relationshipType": "MENTIONS",
      "to": "mentioned",
      "properties": {
        "displayText": "@Jin",
        "count": 1,
        "firstStartOffset": 0,
        "firstEndOffset": 4
      }
    }
  ],
  "provenance": {
    "producer": "dashway-chat",
    "producerVersion": "0.1.0",
    "trigger": "chat.message.created"
  }
}
```

이 patch를 consumer가 처리하면 Neo4j에는 아래 의미가 저장된다.

```text
(:Person {id: "member:7"})-[:SENT]->(:ChatMessage {id: "chat-message:101"})
(:ChatMessage {id: "chat-message:101"})-[:IN_ROOM]->(:ChatRoom {id: "chat-room:room-1"})
(:ChatMessage {id: "chat-message:101"})-[:MENTIONS]->(:Person {id: "member:12"})
```

## 예시: 문서가 Concept을 참조

문서 서비스가 RFC 문서를 저장하고 이 문서가 `Onboarding Flow` 개념에 관한 것이라고 판단했다.

```json
{
  "messageType": "dashway.graph.patch.v1",
  "patchId": "patch-doc-rfc-77-v1",
  "idempotencyKey": "docs:document:77:v1",
  "sourceService": "docs",
  "workspaceId": "workspace_default",
  "occurredAt": "2026-05-24T11:00:00Z",
  "schemaVersion": "2026-05",
  "operations": [
    {
      "op": "upsertNode",
      "alias": "document",
      "nodeType": "Document",
      "id": "document:docs:77",
      "properties": {
        "provider": "dashway-docs",
        "title": "Onboarding Flow RFC",
        "url": "dashway://docs/77",
        "createdAt": "2026-05-24T11:00:00Z"
      }
    },
    {
      "op": "upsertNode",
      "alias": "concept",
      "nodeType": "Concept",
      "id": "concept:onboarding-flow",
      "properties": {
        "name": "Onboarding Flow",
        "type": "feature",
        "status": "active"
      }
    },
    {
      "op": "upsertRelationship",
      "from": "document",
      "relationshipType": "ABOUT",
      "to": "concept",
      "properties": {
        "score": 0.94,
        "extractedBy": "docs-rule-v1"
      }
    }
  ],
  "provenance": {
    "producer": "dashway-docs",
    "producerVersion": "0.1.0",
    "trigger": "document.created"
  }
}
```

## 새 nodeType이 필요한 경우

새 서비스가 core nodeType으로 표현하기 어려운 객체를 저장해야 한다면 `Graph Extension Manifest`를 먼저 만든다.

예: calendar 서비스가 `CalendarEvent`를 쓰고 싶을 때.

```json
{
  "manifestType": "dashway.graph.extension.v1",
  "extensionId": "dashway/calendar",
  "version": "0.1.0",
  "ownerService": "calendar",
  "nodeTypes": [
    {
      "nodeType": "CalendarEvent",
      "idPrefix": "calendar-event",
      "requiredProperties": ["title", "startsAt"],
      "allowedProperties": [
        "title",
        "startsAt",
        "endsAt",
        "location",
        "rawRef"
      ]
    }
  ],
  "relationshipTypes": [
    {
      "relationshipType": "ATTENDS",
      "from": ["Person"],
      "to": ["CalendarEvent"]
    },
    {
      "relationshipType": "ABOUT",
      "from": ["CalendarEvent"],
      "to": ["Concept"]
    }
  ]
}
```

Manifest가 등록된 뒤에만 서비스는 `CalendarEvent`, `ATTENDS`를 Graph Patch에서 사용할 수 있다.

Manifest 등록 전에 보낸 `CalendarEvent` patch가 있다면, consumer는 node를 `ExternalObject`로 보관하고 relationship은 `GraphRelationshipIntent`로 보관한다. Manifest가 등록된 뒤 reconciliation job이 해당 object와 intent를 검증해서 정식 graph element로 승격한다.

```text
ExternalObject(originalNodeType = "CalendarEvent")
  -> CalendarEvent
  -> searchable = true

GraphRelationshipIntent(relationshipType = "ATTENDS")
  -> Person -[:ATTENDS]-> CalendarEvent
  -> status = applied
```

Manifest가 들어와도 모든 unknown object와 relationship이 무조건 부활하는 것은 아니다. manifest가 허용한 node type, relationship type, from/to 방향, required property, workspace boundary를 모두 통과한 것만 승격된다.

## Manifest는 어디에 저장하나

서비스 개발자는 자기 서비스 repo/package에 manifest 파일을 둔다.

권장 파일명:

```text
dashway.graph-extension.json
```

예:

```text
apps/calendar/dashway.graph-extension.json
apps/meetings/dashway.graph-extension.json
plugins/github/dashway.graph-extension.json
```

이 파일은 코드처럼 review 받고 versioning한다.

현재 단계에서는 이 manifest 파일을 파일 기반 registry에 넣는다.

현재 런타임 source of truth:

```text
neo4j-writer-api/config/graph-manifests/*.json
```

또는 배포 환경에서 아래 directory를 지정한다.

```text
GRAPH_MANIFEST_DIR=/etc/dashway/graph-manifests
```

graph consumer는 이 directory의 manifest들을 읽어서 검증에 사용한다.

Postgres registry는 나중에 도입한다.

```text
Postgres: graph_extension_manifests
```

Postgres가 필요한 시점:

- 플러그인을 런타임에 설치/비활성화해야 할 때
- manifest 상태를 `pending`, `active`, `disabled`, `rejected`로 관리해야 할 때
- workspace별로 활성 manifest가 달라져야 할 때
- 외부 플러그인 승인/검수 흐름이 필요할 때

전환을 쉽게 하기 위해 구현은 registry 인터페이스를 둔다.

```text
GraphManifestRegistry
  -> FileGraphManifestRegistry       // current
  -> PostgresGraphManifestRegistry   // later
```

정리하면:

```text
서비스 repo의 manifest 파일 = 개발/배포 원본
file-based manifest registry = 현재 런타임 source of truth
Postgres manifest registry = 나중에 도입할 런타임 source of truth
graph consumer cache = 빠른 검증용 캐시
Neo4j = manifest 저장소가 아님
```

## Producer 구현 체크리스트

서비스 개발자는 구현 전에 아래를 확인한다.

1. 이 이벤트에서 어떤 node가 생기는가?
2. 각 node는 core nodeType으로 표현 가능한가?
3. 각 node의 stable id는 무엇인가?
4. 어떤 relationship이 생기는가?
5. relationship 방향은 맞는가?
6. 같은 이벤트가 두 번 발행되어도 idempotencyKey가 같은가?
7. property에 nested object가 없는가?
8. 큰 원문은 `rawRef`로 뺐는가?
9. 새 nodeType/relationshipType이면 manifest가 있는가?
10. producer version과 trigger를 provenance에 남겼는가?

## 금지 사항

서비스는 아래를 하면 안 된다.

- Cypher 문자열 생성
- 임의 nodeType 사용
- 임의 relationshipType 사용
- delete operation 발행
- 중첩 JSON property 발행
- email/name/title 같은 변경 가능 값을 node id로 사용
- Neo4j 장애를 서비스 핵심 트랜잭션 실패로 연결

## 관련 문서

- [Dashway Graph Patch Language](./GRAPH_PATCH_LANGUAGE.md)
- [Chat Service Graph Patch Mapping](./CHAT_GRAPH_PATCH_MAPPING.md)
