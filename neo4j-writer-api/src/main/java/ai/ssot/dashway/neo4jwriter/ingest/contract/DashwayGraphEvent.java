package ai.ssot.dashway.neo4jwriter.ingest.contract;

import java.util.Map;

public record DashwayGraphEvent(
    String eventId,
    String eventType,
    String source,
    String occurredAt,
    Map<String, Object> payload
) {
}
