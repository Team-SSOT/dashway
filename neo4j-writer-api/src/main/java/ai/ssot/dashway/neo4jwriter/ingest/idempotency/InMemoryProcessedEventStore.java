package ai.ssot.dashway.neo4jwriter.ingest.idempotency;

import ai.ssot.dashway.neo4jwriter.ingest.config.IngestIdempotencyProperties;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class InMemoryProcessedEventStore implements ProcessedEventStore {

    private final Map<String, Instant> processedEvents = new ConcurrentHashMap<>();
    private final IngestIdempotencyProperties properties;
    private final Clock clock;

    @Autowired
    public InMemoryProcessedEventStore(IngestIdempotencyProperties properties) {
        this(properties, Clock.systemUTC());
    }

    public InMemoryProcessedEventStore(IngestIdempotencyProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    @Override
    public boolean isProcessed(String eventId) {
        Instant processedAt = processedEvents.get(eventId);
        if (processedAt == null) {
            return false;
        }

        if (isExpired(processedAt)) {
            processedEvents.remove(eventId);
            return false;
        }

        return true;
    }

    @Override
    public void markProcessed(String eventId) {
        processedEvents.put(eventId, clock.instant());
    }

    @Scheduled(fixedDelayString = "${dashway.ingest.idempotency.cleanup-interval-ms:3600000}")
    public void cleanupExpiredEntries() {
        processedEvents.entrySet().removeIf(entry -> isExpired(entry.getValue()));
    }

    private boolean isExpired(Instant processedAt) {
        return processedAt.plusMillis(properties.getTtlMs()).isBefore(clock.instant());
    }
}
