# Dashway Graph Patch Language

## 목적

Dashway의 모든 서비스는 Neo4j에 직접 Cypher를 보내지 않는다.

각 서비스는 이 문서의 `Graph Patch` 문법에 맞춰 그래프 변경 요청을 만들고 큐에 발행한다. `neo4j-writer-api`는 큐에서 메시지를 읽어 파싱, 검증, 정규화, 컴파일한 뒤 Neo4j에 저장한다.

```text
Dashway Service
  -> Graph Patch message
  -> Queue
  -> Graph Patch Consumer
  -> Parser / Validator
  -> Graph Projector
  -> Neo4j
```

이 문법의 목표는 서비스별 구현을 열어두면서도 Dashway 그래프의 node, relationship, property 형태를 중앙에서 관리하는 것이다.

## 원칙

1. 서비스는 raw Cypher를 만들지 않는다.
2. 서비스는 "무엇을 저장할지"만 Graph Patch로 선언한다.
3. Neo4j label과 relationship type은 등록된 ontology 또는 extension manifest에 있어야 한다.
4. 모든 node id는 deterministic 해야 한다.
5. 모든 patch는 재처리해도 같은 결과가 나와야 한다.
6. 중첩 JSON은 Neo4j property로 저장하지 않는다.
7. 원문, 대용량 payload, 첨부파일은 raw store에 두고 Graph Patch에는 참조만 둔다.
8. extractor/LLM 결과는 confidence와 provenance를 남긴다.

## Message Envelope

서비스가 큐에 발행하는 최상위 메시지다.

```json
{
  "messageType": "dashway.graph.patch.v1",
  "patchId": "patch-chat-message-101-v1",
  "idempotencyKey": "chat:message:101:v1",
  "sourceService": "chat",
  "workspaceId": "workspace_default",
  "occurredAt": "2026-05-23T02:30:00Z",
  "schemaVersion": "2026-05",
  "operations": [],
  "provenance": {
    "producer": "dashway-chat",
    "producerVersion": "0.1.0",
    "trigger": "chat.message.created"
  }
}
```

### Required fields

- `messageType`: 항상 `dashway.graph.patch.v1`
- `patchId`: patch 자체의 고유 id
- `idempotencyKey`: 재시도/중복 발행 방지 키
- `sourceService`: `chat`, `calendar`, `issue-tracker` 같은 발행 서비스 이름
- `workspaceId`: tenant/workspace 경계
- `occurredAt`: 원 이벤트 발생 시각
- `schemaVersion`: 이 문법/ontology 기준 버전
- `operations`: node/relationship 변경 목록

`patchId`와 `idempotencyKey`는 다르다.

- `patchId`: 이 메시지를 추적하기 위한 id
- `idempotencyKey`: 같은 변경을 이미 처리했는지 판단하는 키

## Operations

MVP는 두 가지 operation만 허용한다.

- `upsertNode`
- `upsertRelationship`

`delete`, `detachDelete`, raw Cypher execution은 v1에서 금지한다.

## Operation: upsertNode

```json
{
  "op": "upsertNode",
  "alias": "message",
  "nodeType": "ChatMessage",
  "id": "chat-message:101",
  "properties": {
    "messageId": 101,
    "roomId": "8e31af49-33e5-4f8b-9fd7-f50f7e2f2b23",
    "content": "@Jin 온보딩 플로우 확인 부탁해요",
    "source": "dashway-chat",
    "createdAt": "2026-05-23T02:30:00Z"
  }
}
```

### Fields

- `op`: `upsertNode`
- `alias`: 같은 patch 안에서 relationship이 참조할 수 있는 임시 이름
- `nodeType`: ontology에 등록된 node type
- `id`: Dashway 전체에서 안정적인 node id
- `properties`: Neo4j에 저장할 scalar property map

### Rules

- `alias`는 patch 안에서 유일해야 한다.
- `nodeType`은 core ontology 또는 extension manifest에 있어야 한다.
- `id`는 필수다.
- `properties.id`를 보내지 않는다. consumer가 top-level `id`를 property로 넣는다.
- consumer는 `workspaceId`, `sourceService`, `updatedAt` 같은 공통 property를 보강할 수 있다.

## Operation: upsertRelationship

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
    "displayText": "@Jin",
    "count": 1,
    "firstStartOffset": 0,
    "firstEndOffset": 4
  }
}
```

### Fields

- `op`: `upsertRelationship`
- `from`: alias 또는 node reference
- `relationshipType`: ontology에 등록된 relationship type
- `to`: alias 또는 node reference
- `properties`: relationship에 저장할 scalar property map

### Node reference

relationship의 `from`, `to`는 둘 중 하나다.

Alias:

```json
"message"
```

Explicit reference:

```json
{
  "nodeType": "Person",
  "id": "member:12"
}
```

### Rules

- `relationshipType`은 core ontology 또는 extension manifest에 있어야 한다.
- alias는 같은 patch의 `upsertNode.alias`로 해석한다.
- explicit reference는 기존 node 또는 같은 patch에서 생성되는 node를 가리킨다.
- relationship은 방향성을 가진다.
- v1의 relationship identity는 `(from id, relationshipType, to id)`다.

같은 두 node 사이에 같은 type의 관계를 여러 개 저장해야 하는 경우에는 relationship 여러 개가 아니라 별도 event node를 만든다.

예:

```text
ChatMessage -[:HAS_MENTION]-> Mention -[:MENTIONS]-> Person
```

## Property Rules

Neo4j property는 아래 타입만 허용한다.

- string
- number
- boolean
- string array
- number array
- boolean array

금지:

```json
{
  "nested": {
    "value": true
  }
}
```

대신 raw store reference를 넣는다.

```json
{
  "rawRef": "postgres:raw_graph_events:evt_101"
}
```

Property key는 아래 패턴을 따라야 한다.

```text
^[A-Za-z][A-Za-z0-9_]*$
```

## Id Rules

node id는 서비스가 직접 만든다. 단, deterministic 해야 한다.

권장 규칙:

```text
{domain}:{sourceObjectId}
{domain}:{workspaceId}:{sourceObjectId}
```

예:

```text
member:12
chat-room:8e31af49-33e5-4f8b-9fd7-f50f7e2f2b23
chat-message:101
calendar-event:workspace_default:evt_123
document:notion:workspace_default:page_456
external-object:github:workspace_default:pull_request:99
```

주의:

- email, display name 같은 변경 가능하거나 민감한 값은 id로 쓰지 않는다.
- 같은 source object는 항상 같은 id를 만들어야 한다.
- 다른 서비스의 같은 사람은 가능하면 같은 `Person` id로 합류해야 한다.

## Core Ontology

처음부터 모든 서비스를 위해 열어두는 node type이다.

### Node types

- `Person`
- `Workspace`
- `ChatRoom`
- `ChatMessage`
- `Message`
- `Document`
- `Issue`
- `PullRequest`
- `Commit`
- `File`
- `Repo`
- `Concept`
- `Task`
- `Decision`
- `Chunk`
- `ExternalObject`

### Relationship types

- `SENT`
- `AUTHORED`
- `EDITED`
- `IN_ROOM`
- `IN_CHANNEL`
- `IN_REPO`
- `MEMBER_OF`
- `TO`
- `REPLY_TO`
- `MENTIONS`
- `REFERENCES`
- `ABOUT`
- `HAS_CHUNK`
- `PROPOSES`
- `REQUESTS_REVIEW_FROM`
- `ASSIGNED_TO`
- `MADE`
- `SUPPORTED_BY`
- `BLOCKED_BY`
- `RESOLVES`
- `IMPLEMENTS`
- `RELATED_TO`

서비스는 가능하면 core ontology에 먼저 매핑한다. 정말 새로운 도메인 개념이 필요할 때만 extension manifest로 새 node/relationship을 추가한다.

## Unknown Type Handling

오픈소스 서비스나 초기 개발 중인 서비스는 아직 manifest가 등록되지 않은 node type을 보낼 수 있다.

Dashway는 unknown node type을 바로 버리지 않는다. 대신 안전한 격리 노드로 저장한다.

```text
Unknown nodeType
  -> ExternalObject로 저장
  -> search/index/evidence pack에서는 제외
  -> patch status는 applied_with_unknown_types 또는 quarantined
  -> manifest 등록 후 정식 node type으로 승격 가능
```

예를 들어 manifest 없이 아래 patch가 들어왔다고 하자.

```json
{
  "op": "upsertNode",
  "alias": "meeting",
  "nodeType": "Meeting",
  "id": "meeting:123",
  "properties": {
    "title": "Weekly Sync",
    "startedAt": "2026-05-24T10:00:00Z"
  }
}
```

Consumer는 Neo4j에 아래처럼 저장한다.

```text
(:ExternalObject {
  id: "external:meetings:meeting:123",
  originalNodeType: "Meeting",
  originalId: "meeting:123",
  sourceService: "meetings",
  workspaceId: "workspace_default",
  graphVisibility: "quarantined",
  searchable: false,
  title: "Weekly Sync",
  startedAt: "2026-05-24T10:00:00Z"
})
```

원칙:

- unknown node는 `ExternalObject` label로 저장한다.
- 원래 service가 보낸 `nodeType`은 `originalNodeType`에 남긴다.
- 원래 id는 `originalId`에 남긴다.
- 실제 Neo4j `id`는 충돌 방지를 위해 `external:{sourceService}:{originalId}` 형태로 만든다.
- `graphVisibility`는 `quarantined`로 둔다.
- `searchable`은 `false`로 둔다.
- search index, default graph search, LLM evidence pack에는 넣지 않는다.

Unknown relationship type은 Neo4j 관계로 바로 저장하지 않는다. 대신 나중에 manifest가 등록되면 재처리할 수 있도록 relationship intent를 격리 저장한다.

이유:

- relationship은 그래프 의미를 강하게 바꾸기 때문에 잘못된 타입/방향으로 바로 연결하면 검색과 evidence pack이 오염된다.
- 하지만 intent를 버리면 manifest 등록 후에도 관계를 복구할 수 없다.

Unknown relationship이 들어오면 patch status에는 경고를 남기고, 해당 relationship operation은 graph edge가 아니라 pending intent로 저장한다.

```json
{
  "status": "applied_with_warnings",
  "warnings": [
    {
      "code": "UNKNOWN_RELATIONSHIP_TYPE",
      "operationIndex": 3,
      "relationshipType": "ATTENDS"
    }
  ]
}
```

Pending intent 예:

```text
(:GraphRelationshipIntent {
  id: "relationship-intent:patch-meeting-123-v1:3",
  patchId: "patch-meeting-123-v1",
  operationIndex: 3,
  relationshipType: "ATTENDS",
  fromNodeType: "Person",
  fromId: "member:7",
  toNodeType: "Meeting",
  toId: "meeting:123",
  sourceService: "meetings",
  workspaceId: "workspace_default",
  status: "pending_manifest",
  graphVisibility: "quarantined",
  searchable: false
})
```

서비스가 정식으로 검색/조회되게 하려면 extension manifest를 등록해야 한다.

Manifest 등록 후에는 migration/reconciliation job이 `ExternalObject`와 `GraphRelationshipIntent`를 정식 graph element로 승격한다.

```text
ExternalObject(originalNodeType = "Meeting")
  -> Meeting
  -> constraints/indexes 생성
  -> searchable = true

GraphRelationshipIntent(relationshipType = "ATTENDS")
  -> validate manifest from/to rules
  -> Person -[:ATTENDS]-> Meeting
  -> status = applied
```

단, manifest가 들어왔다고 모든 pending object가 무조건 부활하는 것은 아니다. 아래 조건을 통과한 것만 승격한다.

- manifest가 해당 node type 또는 relationship type을 등록한다.
- sourceService가 해당 extension을 사용할 수 있다.
- relationship의 from/to node type 조합이 manifest에 허용되어 있다.
- required property가 채워져 있다.
- property shape가 여전히 유효하다.
- workspace boundary가 맞다.

조건을 통과하지 못한 object/intent는 계속 quarantined 상태로 남긴다.

## Extension Manifest

오픈소스 서비스나 플러그인이 새 node type이나 relationship type을 쓰고 싶으면 manifest를 제공한다.

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
        "description",
        "startsAt",
        "endsAt",
        "location",
        "source",
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

Manifest는 "이 서비스가 어떤 graph vocabulary를 쓸 수 있는지"를 선언한다.

Consumer는 patch를 처리할 때 다음을 확인한다.

- 이 `sourceService`가 해당 extension을 사용할 수 있는가
- `nodeType`이 core 또는 extension에 등록되어 있는가
- `relationshipType`이 core 또는 extension에 등록되어 있는가
- relationship의 from/to node type 조합이 허용되는가
- required property가 있는가
- property가 scalar shape를 지키는가

단, 등록되지 않은 `nodeType`은 위의 Unknown Type Handling 정책에 따라 `ExternalObject`로 격리 저장할 수 있다. 등록되지 않은 `relationshipType`은 graph edge로 저장하지 않고 `GraphRelationshipIntent`로 격리 저장한다.

## Manifest Storage

현재 결정:

```text
MVP/current phase: file-based manifest registry
Later phase: Postgres manifest registry
```

Manifest는 현재 단계에서 두 곳에 존재한다.

```text
Service / Plugin repository
  -> manifest file
  -> file-based manifest registry
  -> graph consumer cache
```

### 1. Service-owned file

각 서비스나 플러그인은 자기 repo/package 안에 manifest 파일을 가진다.

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

이 파일은 서비스 개발자가 수정하고 review 받는 원본이다.

### 2. File-based manifest registry

현재 런타임에서 graph consumer가 신뢰하는 source of truth는 파일 기반 manifest registry다.

기본 위치:

```text
neo4j-writer-api/config/graph-manifests/*.json
```

또는 환경변수로 manifest directory를 지정한다.

```text
GRAPH_MANIFEST_DIR=/etc/dashway/graph-manifests
```

각 manifest 파일은 `manifestType`, `extensionId`, `version`, `ownerService`를 포함해야 한다.

### 3. Graph consumer cache

`neo4j-writer-api`의 graph consumer는 manifest directory의 파일들을 읽어서 메모리 캐시에 올린다.

```text
manifest files
  -> nodeType allowlist
  -> relationshipType allowlist
  -> from/to validation rules
  -> required/allowed property rules
```

manifest 파일이 변경되면 consumer는 재시작 또는 explicit reload로 cache를 갱신한다.

### Later: Postgres manifest registry

오픈소스 플러그인 설치/비활성화, workspace별 활성화, 승인 상태 관리가 필요해지면 Postgres registry로 승격한다.

그때의 권장 저장소:

```text
Postgres table: graph_extension_manifests
```

권장 필드:

```text
extension_id
owner_service
version
status              // pending | active | disabled | rejected
manifest_json
manifest_hash
registered_at
activated_at
```

Postgres 전환을 쉽게 하기 위해 consumer는 manifest를 직접 파일 API에 묶지 않고 `GraphManifestRegistry` 같은 인터페이스를 통해 읽는다.

```text
GraphManifestRegistry
  -> FileGraphManifestRegistry       // current
  -> PostgresGraphManifestRegistry   // later
```

Neo4j는 manifest의 source of truth가 아니다. Neo4j에는 graph data와 constraints/indexes만 둔다.

## Neo4j Schema Boundary

Neo4j는 RDB처럼 테이블 스키마를 먼저 만들지 않아도 node label과 relationship type을 저장할 수 있다. 하지만 Dashway는 운영 안정성을 위해 schema-less처럼 쓰지 않는다.

Dashway에서 schema 역할을 하는 것은 아래 두 가지다.

```text
Graph Patch Language
  + Core Ontology / Extension Manifest
  + Neo4j constraints and indexes
```

서비스는 constraints나 index를 직접 만들지 않는다. 서비스는 manifest로 graph vocabulary를 선언하고, `neo4j-writer-api` 또는 bootstrap job이 필요한 Neo4j constraints를 만든다.

기본 constraint 예:

```cypher
CREATE CONSTRAINT person_id IF NOT EXISTS
FOR (n:Person)
REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT chat_message_id IF NOT EXISTS
FOR (n:ChatMessage)
REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT chat_room_id IF NOT EXISTS
FOR (n:ChatRoom)
REQUIRE n.id IS UNIQUE;
```

새 extension이 `CalendarEvent`를 등록하면 bootstrap은 아래 같은 constraint를 추가할 수 있다.

```cypher
CREATE CONSTRAINT calendar_event_id IF NOT EXISTS
FOR (n:CalendarEvent)
REQUIRE n.id IS UNIQUE;
```

정리하면:

- Neo4j 자체는 유연하다.
- Dashway producer는 자유롭게 아무 label이나 만들 수 없다.
- 새 node/relationship은 manifest에 등록되어야 한다.
- 등록된 node type은 최소한 `id` unique constraint를 가진다.

## Queue Contract

기본 exchange/queue 이름은 운영 설정에서 바꿀 수 있지만, 메시지 의미는 아래처럼 고정한다.

```text
exchange: dashway.graph
routing key: graph.patch
queue: dashway.graph.patch
```

Consumer 처리 순서:

```text
1. consume message
2. parse envelope
3. check messageType
4. check idempotencyKey
5. build alias table
6. validate node/relationship against ontology + extension manifests
7. normalize properties
8. compile to BatchWriteRequest
9. write to Neo4j in one transaction
10. record patch status
11. ack
```

실패 처리:

- JSON parse error: DLQ
- unknown nodeType: store as quarantined `ExternalObject`
- unknown relationshipType: store as quarantined `GraphRelationshipIntent`
- invalid property shape: DLQ
- transient Neo4j error: retry
- duplicate idempotencyKey with same payload hash: ack as already processed
- duplicate idempotencyKey with different payload hash: DLQ

## Compilation Target

Consumer는 Graph Patch를 현재 writer의 `BatchWriteRequest`로 컴파일한다.

Graph Patch:

```json
{
  "op": "upsertNode",
  "alias": "message",
  "nodeType": "ChatMessage",
  "id": "chat-message:101",
  "properties": {
    "messageId": 101
  }
}
```

Compiled batch node:

```json
{
  "label": "ChatMessage",
  "keyProperty": "id",
  "keyValue": "chat-message:101",
  "properties": {
    "id": "chat-message:101",
    "messageId": 101
  }
}
```

Graph Patch:

```json
{
  "op": "upsertRelationship",
  "from": "sender",
  "relationshipType": "SENT",
  "to": "message",
  "properties": {
    "at": "2026-05-23T02:30:00Z"
  }
}
```

Compiled batch relationship:

```json
{
  "from": {
    "label": "Person",
    "match": {
      "id": "member:7"
    }
  },
  "to": {
    "label": "ChatMessage",
    "match": {
      "id": "chat-message:101"
    }
  },
  "type": "SENT",
  "properties": {
    "at": "2026-05-23T02:30:00Z"
  }
}
```

## Chat Example

채팅 서비스에서 메시지 하나가 생성되었고, 한 명을 멘션한 경우.

```json
{
  "messageType": "dashway.graph.patch.v1",
  "patchId": "patch-chat-message-101-v1",
  "idempotencyKey": "chat:message:101:v1",
  "sourceService": "chat",
  "workspaceId": "workspace_default",
  "occurredAt": "2026-05-23T02:30:00Z",
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
      "id": "chat-room:8e31af49-33e5-4f8b-9fd7-f50f7e2f2b23",
      "properties": {
        "roomId": "8e31af49-33e5-4f8b-9fd7-f50f7e2f2b23",
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
        "roomId": "8e31af49-33e5-4f8b-9fd7-f50f7e2f2b23",
        "content": "@Jin 온보딩 플로우 확인 부탁해요",
        "createdAt": "2026-05-23T02:30:00Z"
      }
    },
    {
      "op": "upsertRelationship",
      "from": "sender",
      "relationshipType": "SENT",
      "to": "message",
      "properties": {
        "at": "2026-05-23T02:30:00Z"
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
      "from": "sender",
      "relationshipType": "MEMBER_OF",
      "to": "room",
      "properties": {
        "role": "MEMBER"
      }
    },
    {
      "op": "upsertRelationship",
      "from": "mentioned",
      "relationshipType": "MEMBER_OF",
      "to": "room",
      "properties": {
        "role": "MEMBER"
      }
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

## Producer Checklist

새 서비스가 Graph Patch producer를 만들 때 확인할 것:

1. core ontology에 매핑 가능한지 먼저 본다.
2. 새 node/relationship이 필요하면 extension manifest를 작성한다.
3. 모든 node id 규칙을 문서화한다.
4. patch id와 idempotency key를 deterministic하게 만든다.
5. operation에는 raw Cypher를 넣지 않는다.
6. property는 scalar만 보낸다.
7. 대용량 원문은 raw store에 넣고 `rawRef`만 보낸다.
8. relationship이 여러 번 발생할 수 있으면 event node가 필요한지 판단한다.
9. producer version을 provenance에 남긴다.
10. 같은 event를 재발행해도 같은 graph 결과가 나오는지 테스트한다.

## MVP Decisions

- language name: `Dashway Graph Patch Language`
- queue message type: `dashway.graph.patch.v1`
- operation v1: `upsertNode`, `upsertRelationship`
- raw Cypher: disabled
- delete operation: disabled
- relationship identity: `(from id, relationshipType, to id)`
- extension model: manifest allowlist
- consumer target: existing `BatchWriteRequest`
