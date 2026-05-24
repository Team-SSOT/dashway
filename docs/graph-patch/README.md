# Graph Patch Docs

Dashway 서비스들이 Neo4j에 저장할 graph query를 만드는 방법을 정리한 문서 모음이다.

## 읽는 순서

1. [Graph Patch Producer Guide](./GRAPH_PATCH_PRODUCER_GUIDE.md)
   - 서비스 개발자에게 공유할 실전 가이드
   - 어떤 JSON을 만들어 큐에 넣어야 하는지 설명

2. [Dashway Graph Patch Language](./GRAPH_PATCH_LANGUAGE.md)
   - Graph Patch 문법의 상세 스펙
   - unknown node/relationship quarantine, extension manifest, queue contract 포함

3. [Chat Service Graph Patch Mapping](./CHAT_GRAPH_PATCH_MAPPING.md)
   - 채팅 서비스가 공통 문법을 어떻게 쓰는지 보여주는 매핑 예시

## 핵심 흐름

```text
Dashway service
  -> dashway.graph.patch.v1 JSON
  -> queue
  -> graph consumer
  -> parser / validator
  -> Neo4j
```

## 현재 결정

Manifest registry는 지금 단계에서는 파일 기반으로 운영한다.

```text
service/plugin dashway.graph-extension.json
  -> neo4j-writer-api/config/graph-manifests/*.json
  -> graph consumer cache
```

Postgres registry는 나중에 플러그인 설치/비활성화, workspace별 활성화, 승인 상태 관리가 필요해질 때 도입한다.
