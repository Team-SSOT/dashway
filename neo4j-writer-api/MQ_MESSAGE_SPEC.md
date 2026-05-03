# Dashway Graph Ingest MQ Message Spec

이 문서는 Dashway graph ingest producer가 RabbitMQ에 발행해야 하는 메시지 규격을 정의한다. 기준 구현은 `neo4j-writer-api`의 `DashwayGraphEvent`, `GraphIngestListener`, `GraphIngestOrchestrator`, `DashwayGraphEventDispatcher`, `DashwaySchemaDtos`이다.

## 1. RabbitMQ Topology

Producer는 main exchange로만 발행한다. Retry와 DLQ는 consumer가 처리한다.

| Purpose | Exchange | Routing key | Queue |
| --- | --- | --- | --- |
| Main ingest | `dashway.graph` | `ingest` | `dashway.graph.ingest` |
| Retry | `dashway.graph.retry` | `ingest.retry` | `dashway.graph.ingest.retry` |
| Dead letter | `dashway.graph.dlx` | `ingest.dlq` | `dashway.graph.ingest.dlq` |

기본값은 환경 변수로 덮어쓸 수 있다.

| Env | Default |
| --- | --- |
| `GRAPH_EXCHANGE` | `dashway.graph` |
| `GRAPH_ROUTING_KEY` | `ingest` |
| `GRAPH_QUEUE` | `dashway.graph.ingest` |
| `GRAPH_RETRY_EXCHANGE` | `dashway.graph.retry` |
| `GRAPH_RETRY_ROUTING_KEY` | `ingest.retry` |
| `GRAPH_RETRY_QUEUE` | `dashway.graph.ingest.retry` |
| `GRAPH_DLQ_EXCHANGE` | `dashway.graph.dlx` |
| `GRAPH_DLQ_ROUTING_KEY` | `ingest.dlq` |
| `GRAPH_DLQ_QUEUE` | `dashway.graph.ingest.dlq` |

## 2. AMQP Properties

Producer는 아래 properties를 설정한다.

| Property | Value | Required | Notes |
| --- | --- | --- | --- |
| `content_type` | `application/json` | Yes | Consumer는 JSON body를 `DashwayGraphEvent`로 역직렬화한다. |
| `delivery_mode` | persistent | Recommended | Spring `RabbitTemplate` 기반 재발행은 persistent로 설정한다. Producer도 같은 정책을 따른다. |

Producer는 retry/DLQ용 internal header를 직접 설정하지 않는다. 해당 header는 consumer가 실패 메시지를 재발행할 때만 붙인다.

| Header | Owner | Description |
| --- | --- | --- |
| `x-dashway-attempt` | Consumer | 현재 처리 시도 횟수. 없으면 consumer는 `1`로 간주한다. |
| `x-dashway-failure-reason` | Consumer | retry 또는 DLQ 이동 사유. |
| `x-dashway-event-id` | Consumer | 원본 `eventId`. |
| `x-dashway-event-type` | Consumer | 원본 `eventType`. |

## 3. Message Envelope

RabbitMQ message body는 JSON object이며, 최상위 스키마는 아래와 같다.

```json
{
  "eventId": "evt-slack-20260404-000001",
  "eventType": "slack.message.upsert",
  "source": "slack-sync",
  "occurredAt": "2026-04-04T14:30:00Z",
  "payload": {}
}
```

| Field | Type | Producer contract | Consumer hard validation | Description |
| --- | --- | --- | --- | --- |
| `eventId` | string | Required | Required, non-blank | Idempotency key. 같은 `eventId`는 중복 처리에서 skip된다. |
| `eventType` | string | Required | Required, non-blank | 지원 이벤트 타입 중 하나여야 한다. |
| `source` | string | Required | Not enforced | 이벤트를 만든 시스템 이름. 예: `slack-sync`, `github-sync`, `context-api`. |
| `occurredAt` | string | Required | Not enforced | 원본 이벤트 발생 시각. ISO-8601 UTC string 권장. |
| `payload` | object | Required | Required, non-empty | `eventType`별 payload object. |

현재 consumer는 별도 `schemaVersion` field를 사용하지 않는다. Producer는 임의의 top-level field를 추가하지 않는다.

## 4. Supported Event Types

| eventType | Payload schema | Internal handler |
| --- | --- | --- |
| `concept.upsert` | `ConceptUpsertPayload` | `upsertConcept` |
| `person.upsert` | `PersonUpsertPayload` | `upsertPerson` |
| `channel.upsert` | `ChannelUpsertPayload` | `upsertChannel` |
| `repo.upsert` | `RepoUpsertPayload` | `upsertRepo` |
| `slack.message.upsert` | `SlackMessageUpsertPayload` | `upsertSlackMessage` |
| `issue.upsert` | `IssueUpsertPayload` | `upsertIssue` |
| `document.upsert` | `DocumentUpsertPayload` | `upsertDocument` |
| `decision.upsert` | `DecisionUpsertPayload` | `upsertDecision` |
| `dashway.ingest.batch` | `SchemaBatchIngestPayload` | `ingestBatch` |

지원하지 않는 `eventType`은 permanent failure로 처리되어 DLQ로 이동한다.

## 5. Common Nested Types

### ConceptLink

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `conceptId` | string | Yes | 연결할 `Concept.id`. |
| `score` | number | No | 추출 신뢰도 또는 관련도. |
| `extractedBy` | string | No | 링크를 만든 시스템. |

### ReferenceTarget

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `label` | string | Yes | One of `Issue`, `Document`, `SlackMessage`, `PullRequest`, `Commit`, `File`. |
| `id` | string | Yes | 대상 node id. |

### SupportTarget

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `label` | string | Yes | One of `SlackMessage`, `Document`, `Issue`. |
| `id` | string | Yes | 대상 node id. |

## 6. Payload Schemas

### `concept.upsert`

```json
{
  "id": "concept-billing-retry",
  "name": "Billing Retry",
  "type": "domain",
  "aliases": ["payment retry"],
  "summary": "Retry flow for failed billing attempts",
  "status": "active",
  "createdAt": "2026-04-04T14:30:00Z",
  "updatedAt": "2026-04-04T14:30:00Z"
}
```

Required: `id`, `name`.

### `person.upsert`

```json
{
  "id": "person-jay",
  "name": "Jay",
  "email": "jay@example.com",
  "slackUserId": "U123",
  "githubLogin": "jay-dev",
  "team": "engineering",
  "createdAt": "2026-04-04T14:30:00Z",
  "updatedAt": "2026-04-04T14:30:00Z"
}
```

Required: `id`, `name`.

### `channel.upsert`

```json
{
  "id": "channel-engineering",
  "name": "engineering"
}
```

Required: `id`.

### `repo.upsert`

```json
{
  "id": "repo-dashway",
  "name": "dashway",
  "org": "ssot-ai",
  "url": "https://github.com/ssot-ai/dashway"
}
```

Required: `id`, `name`.

### `slack.message.upsert`

```json
{
  "id": "slack-msg-1",
  "channelId": "channel-engineering",
  "channelName": "engineering",
  "threadTs": "1712203200.001",
  "ts": "1712203200.001",
  "text": "Billing retry failure flow 정리 필요",
  "permalink": "https://slack.example/archives/C123/p1712203200001",
  "source": "slack",
  "createdAt": "2026-04-04T14:30:00Z",
  "updatedAt": "2026-04-04T14:30:00Z",
  "authorPersonId": "person-jay",
  "sentAt": "2026-04-04T14:30:00Z",
  "replyToMessageId": "slack-msg-parent",
  "concepts": [
    {
      "conceptId": "concept-billing-retry",
      "score": 0.96,
      "extractedBy": "pipeline"
    }
  ],
  "references": [
    {
      "label": "Issue",
      "id": "issue-billing-retry"
    }
  ]
}
```

Required: `id`. `channelId`, `authorPersonId`, `replyToMessageId`, `concepts`, `references`가 있으면 관련 stub node와 relationship을 함께 만든다.

### `issue.upsert`

```json
{
  "id": "issue-billing-retry",
  "provider": "github",
  "repoId": "repo-dashway",
  "repoName": "dashway",
  "repoOrg": "ssot-ai",
  "number": 88,
  "title": "Fix billing retry flow",
  "body": "Retry queue is starving realtime work.",
  "state": "open",
  "priority": "high",
  "url": "https://github.com/ssot-ai/dashway/issues/88",
  "createdAt": "2026-04-04T14:30:00Z",
  "updatedAt": "2026-04-04T14:35:00Z",
  "authorPersonId": "person-jay",
  "authoredAt": "2026-04-04T14:30:00Z",
  "concepts": [
    {
      "conceptId": "concept-billing-retry",
      "score": 0.9,
      "extractedBy": "github-sync"
    }
  ],
  "blockedByIssueIds": ["issue-auth-refresh"],
  "references": [
    {
      "label": "SlackMessage",
      "id": "slack-msg-1"
    }
  ]
}
```

Required: `id`, `title`.

### `document.upsert`

```json
{
  "id": "doc-billing-rfc",
  "provider": "notion",
  "title": "Billing Retry RFC",
  "bodyRef": "notion:block:abc123",
  "url": "https://notion.example/doc-billing-rfc",
  "docType": "rfc",
  "version": "v1",
  "createdAt": "2026-04-04T14:00:00Z",
  "updatedAt": "2026-04-04T14:30:00Z",
  "editorPersonId": "person-jay",
  "editedAt": "2026-04-04T14:30:00Z",
  "concepts": [
    {
      "conceptId": "concept-billing-retry",
      "score": 0.93,
      "extractedBy": "doc-sync"
    }
  ],
  "references": [
    {
      "label": "Issue",
      "id": "issue-billing-retry"
    }
  ]
}
```

Required: `id`, `title`.

### `decision.upsert`

```json
{
  "id": "decision-use-rabbit-retry",
  "summary": "Use RabbitMQ retry queue with TTL for transient graph ingest failures.",
  "status": "accepted",
  "decidedAt": "2026-04-04T15:00:00Z",
  "confidence": 0.91,
  "makerPersonId": "person-jay",
  "conceptId": "concept-billing-retry",
  "supportedBy": [
    {
      "label": "Document",
      "id": "doc-billing-rfc"
    },
    {
      "label": "Issue",
      "id": "issue-billing-retry"
    }
  ]
}
```

Required: `id`, `summary`.

### `dashway.ingest.batch`

Batch payload는 event별 payload list를 한 번에 담는다. 최소 하나 이상의 entity가 필요하다.

```json
{
  "concepts": [
    {
      "id": "concept-billing-retry",
      "name": "Billing Retry"
    }
  ],
  "people": [
    {
      "id": "person-jay",
      "name": "Jay"
    }
  ],
  "channels": [
    {
      "id": "channel-engineering",
      "name": "engineering"
    }
  ],
  "repos": [
    {
      "id": "repo-dashway",
      "name": "dashway",
      "org": "ssot-ai"
    }
  ],
  "slackMessages": [
    {
      "id": "slack-msg-1",
      "channelId": "channel-engineering",
      "text": "Billing retry failure flow 정리 필요"
    }
  ],
  "issues": [
    {
      "id": "issue-billing-retry",
      "title": "Fix billing retry flow"
    }
  ],
  "documents": [
    {
      "id": "doc-billing-rfc",
      "title": "Billing Retry RFC"
    }
  ],
  "decisions": [
    {
      "id": "decision-use-rabbit-retry",
      "summary": "Use RabbitMQ retry queue with TTL."
    }
  ]
}
```

각 list field는 optional이다. 제공된 각 item에는 해당 upsert payload의 required field가 적용된다.

## 7. Publish Example

RabbitMQ Management API로 발행할 때는 `payload` field에 message body JSON을 string으로 넣는다.

```bash
curl -u dashway:dashway123456 \
  -H "content-type: application/json" \
  -X POST http://localhost:15672/api/exchanges/%2F/dashway.graph/publish \
  -d '{
    "properties": {
      "content_type": "application/json",
      "delivery_mode": 2
    },
    "routing_key": "ingest",
    "payload": "{\"eventId\":\"evt-slack-20260404-000001\",\"eventType\":\"slack.message.upsert\",\"source\":\"slack-sync\",\"occurredAt\":\"2026-04-04T14:30:00Z\",\"payload\":{\"id\":\"slack-msg-1\",\"channelId\":\"channel-engineering\",\"channelName\":\"engineering\",\"ts\":\"1712203200.001\",\"text\":\"Billing retry failure flow 정리 필요\",\"source\":\"slack\",\"createdAt\":\"2026-04-04T14:30:00Z\",\"updatedAt\":\"2026-04-04T14:30:00Z\",\"authorPersonId\":\"person-jay\",\"concepts\":[{\"conceptId\":\"concept-billing-retry\",\"score\":0.96,\"extractedBy\":\"pipeline\"}],\"references\":[{\"label\":\"Issue\",\"id\":\"issue-billing-retry\"}]}}",
    "payload_encoding": "string"
  }'
```

정상 routing 응답:

```json
{"routed": true}
```

## 8. Failure Semantics

| Case | Consumer behavior |
| --- | --- |
| Invalid JSON body | Raw message를 DLQ로 publish하고 원본 message ack. |
| Missing `eventId`, missing `eventType`, or empty `payload` | DLQ로 publish. |
| Unsupported `eventType` | DLQ로 publish. |
| Invalid event payload | DLQ로 publish. |
| Neo4j transient failure | Retry queue로 publish. `x-dashway-attempt` 증가. |
| Attempts exceed `GRAPH_MAX_ATTEMPTS` | DLQ로 publish. |
| Duplicate `eventId` | Processing skip 후 ack. |

Retry queue는 TTL 이후 main exchange로 dead-letter되어 다시 consume된다. 기본 retry delay는 `GRAPH_RETRY_DELAY_MS=30000`, 최대 시도 횟수는 `GRAPH_MAX_ATTEMPTS=5`이다.

## 9. Producer Rules

1. `eventId`는 producer 쪽에서 stable하고 globally unique하게 만든다.
2. 같은 logical event를 재발행할 때는 같은 `eventId`를 사용한다.
3. 수정 이벤트를 새 사실로 반영해야 하면 새 `eventId`를 사용한다.
4. `occurredAt`, payload 내부 timestamp는 UTC ISO-8601 string을 사용한다.
5. 비어 있는 string은 보내지 않는다. 모르는 값은 field를 생략하거나 `null`로 둔다.
6. Producer는 main exchange `dashway.graph`와 routing key `ingest`로만 발행한다.
7. Retry/DLQ exchange로 직접 발행하지 않는다.
8. 지원하지 않는 top-level field나 임의의 `eventType`을 추가하지 않는다.
