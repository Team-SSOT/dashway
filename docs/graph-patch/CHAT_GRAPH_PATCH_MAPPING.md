# Chat Service Graph Patch Mapping

## 목적

채팅 서비스에서 메시지가 생성될 때, 그 메시지가 만든 의미 관계를 공통 Graph Patch 문법으로 표현하는 방식을 정한다.

여기서 말하는 "쿼리"는 raw Cypher가 아니라 채팅 서비스가 큐에 발행하는 Graph Patch message다. `neo4j-writer-api`는 그것을 읽어 Neo4j Cypher로 컴파일해서 저장한다.

공통 문법은 [Dashway Graph Patch Language](./GRAPH_PATCH_LANGUAGE.md)를 따른다. 이 문서는 채팅 서비스가 그 문법으로 어떤 node와 relationship을 만들어야 하는지 정하는 서비스별 매핑 문서다.

## 현재 채팅 모델

현재 chat backend는 아래 데이터만 확실히 가지고 있다.

- `ChatRoom`: `id`, `type`, `title`, `isPublic`, `participantKeyHash`
- `ChatRoomMember`: `roomId`, `memberId`, `role`
- `ChatMessage`: `id`, `roomId`, `memberId`, `content`, `createdDatetime`

아직 없는 것:

- 메시지의 구조화된 mention 목록
- reply/thread 대상 메시지
- 첨부파일/링크 preview metadata
- 메시지에서 뽑힌 concept/task/decision

따라서 MVP는 "메시지 생성 + 명시적 멘션"부터 Neo4j에 넣는다.

## 핵심 판단

멘션은 content 문자열만 파싱해서 만들지 않는 것이 좋다.

권장 입력:

```json
{
  "content": "@Jin 온보딩 플로우 확인 부탁해요",
  "mentions": [
    {
      "memberId": 12,
      "displayText": "@Jin",
      "startOffset": 0,
      "endOffset": 4
    }
  ]
}
```

이유:

- `@Jin` 같은 표시 이름은 중복될 수 있다.
- 이름 변경 후 과거 메시지를 다시 파싱하면 다른 사람을 가리킬 수 있다.
- 모바일/웹 클라이언트는 이미 mention autocomplete 시점에 실제 `memberId`를 알고 있다.
- 서버는 `mentions.memberId`가 해당 room member인지 검증할 수 있다.

content parser는 fallback으로만 둔다. 예를 들어 `@member:12` 같은 안정적인 토큰이 들어온 경우에만 파싱한다.

## Neo4j 모델

### Nodes

```text
(:Person {id: "member:12", memberId: 12})
(:ChatRoom {id: "chat-room:{roomId}", roomId, type, title})
(:ChatMessage {id: "chat-message:{messageId}", messageId, roomId, content, createdAt})
(:Concept {id, name})                 // MVP 이후
(:Task {id, summary, status})          // MVP 이후
(:Decision {id, summary, status})      // MVP 이후
```

`Person`은 Context API의 `Member`와 같은 사람을 가리킨다. Neo4j에서는 `member:{memberId}` 형태의 안정적인 id를 쓴다.

### Relationships

```text
(:Person)-[:SENT {at}]->(:ChatMessage)
(:ChatMessage)-[:IN_ROOM]->(:ChatRoom)
(:Person)-[:MEMBER_OF {role, joinedAt}]->(:ChatRoom)
(:ChatMessage)-[:MENTIONS {displayText, startOffset, endOffset}]->(:Person)
(:ChatMessage)-[:TO]->(:Person)                         // direct room 수신자
(:ChatMessage)-[:ABOUT {score, extractedBy}]->(:Concept) // MVP 이후
(:ChatMessage)-[:PROPOSES]->(:Task)                      // MVP 이후
(:Task)-[:ASSIGNED_TO]->(:Person)                        // MVP 이후
```

## Message Created Patch

메시지 생성 이벤트 하나를 Graph Patch message 하나로 만든다.

입력 이벤트:

```json
{
  "eventId": "chat-message-created:101",
  "eventType": "chat.message.created",
  "message": {
    "id": 101,
    "roomId": "8e31af49-33e5-4f8b-9fd7-f50f7e2f2b23",
    "senderMemberId": 7,
    "content": "@Jin 온보딩 플로우 확인 부탁해요",
    "createdDatetime": "2026-05-23T02:30:00Z"
  },
  "mentions": [
    {
      "memberId": 12,
      "displayText": "@Jin",
      "startOffset": 0,
      "endOffset": 4
    }
  ],
  "room": {
    "type": "GROUP",
    "title": "Product"
  },
  "roomMembers": [
    {
      "memberId": 7,
      "role": "MEMBER",
      "joinedDatetime": "2026-05-20T00:00:00Z"
    },
    {
      "memberId": 12,
      "role": "MEMBER",
      "joinedDatetime": "2026-05-20T00:00:00Z"
    }
  ]
}
```

채팅 서비스가 만든 Graph Patch는 writer에서 최종적으로 아래와 같은 `BatchWriteRequest`로 컴파일된다.

```json
{
  "nodes": [
    {
      "label": "Person",
      "keyProperty": "id",
      "keyValue": "member:7",
      "properties": {
        "memberId": 7
      }
    },
    {
      "label": "Person",
      "keyProperty": "id",
      "keyValue": "member:12",
      "properties": {
        "memberId": 12
      }
    },
    {
      "label": "ChatRoom",
      "keyProperty": "id",
      "keyValue": "chat-room:8e31af49-33e5-4f8b-9fd7-f50f7e2f2b23",
      "properties": {
        "roomId": "8e31af49-33e5-4f8b-9fd7-f50f7e2f2b23",
        "type": "GROUP",
        "title": "Product",
        "source": "dashway-chat"
      }
    },
    {
      "label": "ChatMessage",
      "keyProperty": "id",
      "keyValue": "chat-message:101",
      "properties": {
        "messageId": 101,
        "roomId": "8e31af49-33e5-4f8b-9fd7-f50f7e2f2b23",
        "content": "@Jin 온보딩 플로우 확인 부탁해요",
        "source": "dashway-chat",
        "createdAt": "2026-05-23T02:30:00Z"
      }
    }
  ],
  "relationships": [
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
        "at": "2026-05-23T02:30:00Z",
        "sourceEventId": "chat-message-created:101"
      }
    },
    {
      "from": {
        "label": "ChatMessage",
        "match": {
          "id": "chat-message:101"
        }
      },
      "to": {
        "label": "ChatRoom",
        "match": {
          "id": "chat-room:8e31af49-33e5-4f8b-9fd7-f50f7e2f2b23"
        }
      },
      "type": "IN_ROOM",
      "properties": {
        "sourceEventId": "chat-message-created:101"
      }
    },
    {
      "from": {
        "label": "Person",
        "match": {
          "id": "member:7"
        }
      },
      "to": {
        "label": "ChatRoom",
        "match": {
          "id": "chat-room:8e31af49-33e5-4f8b-9fd7-f50f7e2f2b23"
        }
      },
      "type": "MEMBER_OF",
      "properties": {
        "role": "MEMBER",
        "joinedAt": "2026-05-20T00:00:00Z"
      }
    },
    {
      "from": {
        "label": "Person",
        "match": {
          "id": "member:12"
        }
      },
      "to": {
        "label": "ChatRoom",
        "match": {
          "id": "chat-room:8e31af49-33e5-4f8b-9fd7-f50f7e2f2b23"
        }
      },
      "type": "MEMBER_OF",
      "properties": {
        "role": "MEMBER",
        "joinedAt": "2026-05-20T00:00:00Z"
      }
    },
    {
      "from": {
        "label": "ChatMessage",
        "match": {
          "id": "chat-message:101"
        }
      },
      "to": {
        "label": "Person",
        "match": {
          "id": "member:12"
        }
      },
      "type": "MENTIONS",
      "properties": {
        "displayText": "@Jin",
        "startOffset": 0,
        "endOffset": 4,
        "sourceEventId": "chat-message-created:101"
      }
    }
  ]
}
```

## Patch Generation Rules

### 1. Always create sender, room, message

모든 메시지 이벤트는 최소한 아래를 만든다.

```text
Person(sender)
ChatRoom(room)
ChatMessage(message)
Person(sender)-[:SENT]->ChatMessage(message)
ChatMessage(message)-[:IN_ROOM]->ChatRoom(room)
```

### 2. Upsert room membership opportunistically

이벤트에 `roomMembers`가 있으면 멤버십도 같이 upsert한다.

```text
Person(member)-[:MEMBER_OF]->ChatRoom(room)
```

단, 메시지 저장 트랜잭션의 핵심 경로에서는 room member 전체 조회가 부담이 될 수 있다. MVP에서는 sender와 mentioned member의 membership만 넣고, 별도 room sync job에서 전체 membership을 맞추는 방식이 좋다.

### 3. Mentions become direct edges

멘션 하나마다 아래 관계를 만든다.

```text
ChatMessage(message)-[:MENTIONS]->Person(mentioned)
```

관계 property:

- `displayText`
- `startOffset`
- `endOffset`
- `sourceEventId`

현재 `GraphWriteService`는 관계를 아래처럼 merge한다.

```cypher
MERGE (source)-[r:MENTIONS]->(target)
```

그래서 같은 메시지가 같은 사람을 여러 번 멘션해도 `ChatMessage -> Person` 사이의 `MENTIONS` 관계는 하나만 남는다. 이 경우 옵션은 두 가지다.

1. 관계 하나에 `count`, `firstStartOffset`, `firstEndOffset`를 넣는다.
2. `Mention` 노드를 별도로 만든다.

MVP는 관계 하나에 `count`, `firstStartOffset`, `firstEndOffset`만 둔다. 정확한 모든 위치가 중요해지면 `Mention` 노드로 승격한다.

### 4. Direct room adds TO edges

`ChatRoom.type == DIRECT`이면 sender가 아닌 참여자에게 `TO` 관계를 만든다.

```text
ChatMessage(message)-[:TO]->Person(recipient)
```

그룹방에서는 `TO`를 만들지 않는다. 그룹방의 수신자는 방 membership으로 판단한다.

### 5. Concepts/tasks/decisions are second pass

메시지 생성 path에서는 LLM을 바로 호출하지 않는다.

1차 write:

```text
message, sender, room, mentions
```

2차 async extractor:

```text
ChatMessage-[:ABOUT]->Concept
ChatMessage-[:PROPOSES]->Task
Task-[:ASSIGNED_TO]->Person
Decision-[:SUPPORTED_BY]->ChatMessage
```

예:

```text
"@Jin 온보딩 플로우 이번 주까지 확인 부탁해요"

ChatMessage-[:ABOUT {score: 0.88}]->Concept("Onboarding Flow")
ChatMessage-[:PROPOSES]->Task("온보딩 플로우 확인")
Task-[:ASSIGNED_TO]->Person(member:12)
```

## Implementation Plan

### Step 1. Mention input 추가

`SendChatMessageCommand`와 `CreateChatMessageDto`에 mention metadata를 추가한다.

```kotlin
data class MessageMentionInput(
    val memberId: Long,
    val displayText: String,
    val startOffset: Int,
    val endOffset: Int,
)
```

검증:

- mentioned `memberId`가 active room member인지 확인
- offset range가 content 범위 안인지 확인
- `content.substring(startOffset, endOffset) == displayText` 확인

### Step 2. Chat graph event 생성

메시지 저장 후 아래 이벤트를 만든다.

```text
chat.message.created
```

포함 데이터:

- message id
- room id/type/title
- sender member id
- content
- created datetime
- mentions
- direct room recipients

### Step 3. Graph Patch builder 추가

`ChatGraphPatchBuilder`를 만든다.

역할:

- event를 받아 공통 Graph Patch message로 변환
- stable id 생성
- 중복 관계가 생기지 않도록 같은 message/member mention을 합침

stable id:

```text
Person:      member:{memberId}
ChatRoom:    chat-room:{roomId}
ChatMessage: chat-message:{messageId}
```

### Step 4. neo4j-writer-api allowlist 확장

현재 writer가 label/type identifier는 검증하지만 Dashway ontology로 `ChatRoom`, `ChatMessage`, `IN_ROOM`, `MEMBER_OF`를 명시적으로 다루지는 않는다.

추가할 것:

- label: `ChatRoom`, `ChatMessage`
- relationship type: `IN_ROOM`, `MEMBER_OF`, `TO`

`MENTIONS`, `SENT`, `ABOUT`은 기존 모델과 의미가 맞다.

### Step 5. Async delivery

채팅 메시지 저장 트랜잭션 안에서 Neo4j를 직접 호출하지 않는다.

권장:

```text
chat db transaction commit
  -> publish chat.message.created
  -> graph worker builds query
  -> neo4j-writer-api POST /api/graph/batch or RabbitMQ ingest
```

이유:

- Neo4j 장애가 채팅 전송 실패로 번지지 않는다.
- 재시도/DLQ를 분리할 수 있다.
- graph enrichment를 나중에 확장하기 쉽다.

## Open Questions

1. 클라이언트가 mention metadata를 보낼 수 있게 만들까?
2. `ChatMessage.content` 전문을 Neo4j에 저장할까, 아니면 `bodyRef`만 저장할까?
3. 그룹방 전체 멤버십을 메시지 이벤트마다 같이 보낼까, 별도 room sync 이벤트로 분리할까?
4. 같은 메시지에서 같은 사람을 여러 번 멘션할 때 관계 하나로 합칠까, `Mention` 노드를 만들까?
5. Concept/task extraction은 언제 붙일까?

## Recommended MVP

- 클라이언트가 `mentions` 배열을 보낸다.
- Neo4j에는 content를 일단 저장하되 4000자 제한을 그대로 따른다.
- 메시지 이벤트는 sender, room, message, mentioned people만 쓴다.
- room 전체 membership은 `chat.room.created`, `chat.room.member.added` 이벤트에서 따로 맞춘다.
- LLM concept/task extraction은 message write 이후 async second pass로 둔다.
