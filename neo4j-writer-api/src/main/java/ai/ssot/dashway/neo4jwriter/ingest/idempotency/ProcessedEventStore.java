package ai.ssot.dashway.neo4jwriter.ingest.idempotency;

public interface ProcessedEventStore {

    boolean isProcessed(String eventId);

    void markProcessed(String eventId);
}
