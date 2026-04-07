package ai.ssot.dashway.neo4jwriter.ingest.application;

public record GraphIngestOutcome(
    String eventId,
    String eventType,
    Status status,
    String endpointPath
) {
    public enum Status {
        PROCESSED,
        DUPLICATE_SKIPPED,
    }
}
