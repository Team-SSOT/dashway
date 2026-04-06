# neo4j-writer-api

Dashway 저장소 안에서 독립적으로 실행되는 단일 Spring 그래프 백엔드입니다.
Neo4j write API와 RabbitMQ graph ingest consumer를 함께 포함합니다.

## 패키지 구조

역할별 패키지로 나눠져 있습니다.

- `ai.ssot.dashway.neo4jwriter.config`: Neo4j 연결 설정
- `ai.ssot.dashway.neo4jwriter.common`: 공통 예외와 API 에러 응답
- `ai.ssot.dashway.neo4jwriter.graph`: 범용 그래프 API, DTO, Cypher 지원
- `ai.ssot.dashway.neo4jwriter.dashway`: Dashway 스키마 전용 API, DTO, 배치 매핑
- `ai.ssot.dashway.neo4jwriter.ingest`: RabbitMQ consume, retry / DLQ, idempotency, 내부 dispatch
- `ai.ssot.dashway.neo4jwriter.health`: 헬스체크 엔드포인트

## 포함된 API

### 범용 그래프 API

- `GET /health`
- `POST /api/graph/nodes`
- `POST /api/graph/relationships`
- `POST /api/graph/batch`

### Dashway 스키마 전용 API

- `POST /api/dashway/admin/bootstrap`
- `POST /api/dashway/concepts`
- `POST /api/dashway/people`
- `POST /api/dashway/channels`
- `POST /api/dashway/repos`
- `POST /api/dashway/slack-messages`
- `POST /api/dashway/issues`
- `POST /api/dashway/documents`
- `POST /api/dashway/decisions`
- `POST /api/dashway/ingest/batch`

### 내장 RabbitMQ ingest

지원 이벤트 타입:

- `concept.upsert`
- `person.upsert`
- `channel.upsert`
- `repo.upsert`
- `slack.message.upsert`
- `issue.upsert`
- `document.upsert`
- `decision.upsert`
- `dashway.ingest.batch`

## 실행

Neo4j와 RabbitMQ는 저장소 바깥 상위 폴더의 `docker-compose.yml`을 기준으로 띄우면 됩니다.

```bash
# /Users/vanble/dev/openai/dashway 에서
docker compose up -d rabbitmq neo4j
```

백엔드는 이 폴더에서 하나만 실행하면 됩니다.

```bash
cd /Users/vanble/dev/openai/dashway/dashway/neo4j-writer-api
cp .env.example .env
set -a
source .env
set +a
./gradlew bootRun
```

기본 포트는 `8080`이고, REST API와 RabbitMQ consumer가 같은 프로세스에서 함께 동작합니다.

## 요청 예시

### 0. Dashway 제약조건 먼저 만들기

```bash
curl -X POST http://localhost:8080/api/dashway/admin/bootstrap
```

### Dashway 스키마 전용 예시

### 1. Concept 업서트

```bash
curl -X POST http://localhost:8080/api/dashway/concepts \
  -H "Content-Type: application/json" \
  -d '{
    "id": "concept-billing-retry",
    "name": "Billing Retry",
    "type": "feature",
    "aliases": ["retry billing", "payment retry"],
    "summary": "Retry flow for failed billing events",
    "status": "active",
    "createdAt": "2026-04-04T13:00:00Z",
    "updatedAt": "2026-04-04T13:00:00Z"
  }'
```

### 2. SlackMessage 업서트와 관계 자동 생성

```bash
curl -X POST http://localhost:8080/api/dashway/slack-messages \
  -H "Content-Type: application/json" \
  -d '{
    "id": "slack-msg-1",
    "channelId": "channel-engineering",
    "channelName": "engineering",
    "threadTs": "1712203200.001",
    "ts": "1712203200.001",
    "text": "Billing retry failure flow 정리 필요",
    "permalink": "https://slack.example/messages/slack-msg-1",
    "source": "slack",
    "createdAt": "2026-04-04T13:10:00Z",
    "updatedAt": "2026-04-04T13:10:00Z",
    "authorPersonId": "person-jay",
    "concepts": [
      {
        "conceptId": "concept-billing-retry",
        "score": 0.96,
        "extractedBy": "llm"
      }
    ],
    "references": [
      {
        "label": "Issue",
        "id": "issue-billing-12"
      }
    ]
  }'
```

이 요청 하나로 아래가 함께 처리됩니다.

- `(:SlackMessage)`
- `(:Channel)`
- `(:Person)-[:SENT]->(:SlackMessage)`
- `(:SlackMessage)-[:IN_CHANNEL]->(:Channel)`
- `(:SlackMessage)-[:ABOUT]->(:Concept)`
- `(:SlackMessage)-[:REFERENCES]->(:Issue)`

### 3. Decision 업서트와 근거 연결

```bash
curl -X POST http://localhost:8080/api/dashway/decisions \
  -H "Content-Type: application/json" \
  -d '{
    "id": "decision-billing-retry-source-of-truth",
    "summary": "Billing retry decision should be summarized into a concept-centric graph",
    "status": "accepted",
    "decidedAt": "2026-04-04T13:20:00Z",
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
        "id": "issue-billing-12"
      }
    ]
  }'
```

### 4. Queue consumer가 보내기 좋은 배치 ingest

```bash
curl -X POST http://localhost:8080/api/dashway/ingest/batch \
  -H "Content-Type: application/json" \
  -d '{
    "concepts": [
      {
        "id": "concept-team-context-graph",
        "name": "Team Context Graph",
        "type": "system",
        "status": "active"
      }
    ],
    "people": [
      {
        "id": "person-jay",
        "name": "Jay",
        "team": "Platform"
      }
    ],
    "documents": [
      {
        "id": "doc-neo4j-rfc",
        "provider": "notion",
        "title": "Neo4j RFC",
        "docType": "rfc",
        "editorPersonId": "person-jay",
        "concepts": [
          {
            "conceptId": "concept-team-context-graph",
            "score": 0.93,
            "extractedBy": "pipeline"
          }
        ]
      }
    ],
    "decisions": [
      {
        "id": "decision-neo4j-graph",
        "summary": "Use Neo4j as the context graph",
        "status": "accepted",
        "makerPersonId": "person-jay",
        "conceptId": "concept-team-context-graph",
        "supportedBy": [
          {
            "label": "Document",
            "id": "doc-neo4j-rfc"
          }
        ]
      }
    ]
  }'
```

## RabbitMQ 메시지 예시

### 1. Slack 메시지 업서트 이벤트

```json
{
  "eventId": "evt-slack-001",
  "eventType": "slack.message.upsert",
  "source": "slack-sync",
  "occurredAt": "2026-04-04T14:30:00Z",
  "payload": {
    "id": "slack-msg-1",
    "channelId": "channel-engineering",
    "channelName": "engineering",
    "ts": "1712203200.001",
    "text": "Billing retry failure flow 정리 필요",
    "source": "slack",
    "createdAt": "2026-04-04T14:30:00Z",
    "authorPersonId": "person-jay",
    "concepts": [
      {
        "conceptId": "concept-billing-retry",
        "score": 0.96,
        "extractedBy": "pipeline"
      }
    ]
  }
}
```

### 2. RabbitMQ publish 예시

```bash
curl -u dashway:dashway123456 \
  -H "content-type:application/json" \
  -X POST http://localhost:15672/api/exchanges/%2F/dashway.graph/publish \
  -d '{
    "properties": {
      "content_type": "application/json"
    },
    "routing_key": "ingest",
    "payload": "{\"eventId\":\"evt-slack-001\",\"eventType\":\"slack.message.upsert\",\"source\":\"slack-sync\",\"occurredAt\":\"2026-04-04T14:30:00Z\",\"payload\":{\"id\":\"slack-msg-1\",\"channelId\":\"channel-engineering\",\"channelName\":\"engineering\",\"ts\":\"1712203200.001\",\"text\":\"Billing retry failure flow 정리 필요\",\"source\":\"slack\",\"createdAt\":\"2026-04-04T14:30:00Z\",\"authorPersonId\":\"person-jay\",\"concepts\":[{\"conceptId\":\"concept-billing-retry\",\"score\":0.96,\"extractedBy\":\"pipeline\"}]}}",
    "payload_encoding": "string"
  }'
```

## 설계 요약

현재 구조는 "논리적으로는 API와 ingest를 분리하고, 물리적으로는 하나의 Spring 앱으로 배포"하는 형태다.

- REST API와 RabbitMQ consumer를 한 프로세스에서 운영
- HTTP hop 없이 queue payload를 내부 service로 직접 dispatch
- 장애 포인트를 줄이면서도 패키지 경계는 유지
- retry / DLQ / idempotency는 ingest 패키지 안에서 독립적으로 관리

### 범용 그래프 API 예시

### 5. Concept 노드 업서트

```bash
curl -X POST http://localhost:8080/api/graph/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Concept",
    "keyProperty": "id",
    "keyValue": "concept-billing-retry",
    "properties": {
      "name": "Billing Retry",
      "type": "feature",
      "status": "active",
      "summary": "Retry flow for failed billing events"
    }
  }'
```

### 6. Person 노드 업서트

```bash
curl -X POST http://localhost:8080/api/graph/nodes \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Person",
    "keyProperty": "id",
    "keyValue": "person-jay",
    "properties": {
      "name": "Jay",
      "team": "Platform",
      "githubLogin": "jay"
    }
  }'
```

### 7. 관계 업서트

```bash
curl -X POST http://localhost:8080/api/graph/relationships \
  -H "Content-Type: application/json" \
  -d '{
    "from": {
      "label": "Person",
      "match": {
        "id": "person-jay"
      }
    },
    "to": {
      "label": "Concept",
      "match": {
        "id": "concept-billing-retry"
      }
    },
    "type": "ABOUT",
    "properties": {
      "source": "manual",
      "at": "2026-04-04T13:00:00Z"
    }
  }'
```

### 8. 배치 쓰기

```bash
curl -X POST http://localhost:8080/api/graph/batch \
  -H "Content-Type: application/json" \
  -d '{
    "nodes": [
      {
        "label": "Concept",
        "keyProperty": "id",
        "keyValue": "concept-team-context-graph",
        "properties": {
          "name": "Team Context Graph",
          "type": "system",
          "status": "active"
        }
      },
      {
        "label": "Decision",
        "keyProperty": "id",
        "keyValue": "decision-graph-first",
        "properties": {
          "summary": "Use Neo4j as the concept-centric context graph",
          "status": "accepted",
          "confidence": 0.91
        }
      }
    ],
    "relationships": [
      {
        "from": {
          "label": "Decision",
          "match": {
            "id": "decision-graph-first"
          }
        },
        "to": {
          "label": "Concept",
          "match": {
            "id": "concept-team-context-graph"
          }
        },
        "type": "ABOUT",
        "properties": {
          "source": "seed"
        }
      }
    ]
  }'
```

## 설계 메모

- Cypher 식별자(`label`, `type`, `keyProperty`)는 화이트리스트 검증으로만 조합합니다.
- Neo4j property는 scalar 또는 scalar array만 허용합니다.
- 중첩 JSON object는 Neo4j property로 바로 저장되지 않으므로 400 에러로 막습니다.
- 관계는 `MERGE`로 처리해서 같은 방향의 동일 타입 관계가 중복 생성되지 않게 했습니다.
- Dashway 스키마 전용 API는 관련 노드가 아직 없어도 stub node를 먼저 업서트해서 queue 순서가 조금 어긋나도 ingest가 깨지지 않게 했습니다.
- `POST /api/dashway/ingest/batch` 는 queue consumer가 이벤트를 모아 한 번에 넣는 용도로 두었습니다.
