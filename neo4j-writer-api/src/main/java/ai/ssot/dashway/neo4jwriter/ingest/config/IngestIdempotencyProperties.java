package ai.ssot.dashway.neo4jwriter.ingest.config;

import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "dashway.ingest.idempotency")
public class IngestIdempotencyProperties {

    @Min(60_000)
    private long ttlMs = 86_400_000;

    @Min(60_000)
    private long cleanupIntervalMs = 3_600_000;

    public long getTtlMs() {
        return ttlMs;
    }

    public void setTtlMs(long ttlMs) {
        this.ttlMs = ttlMs;
    }

    public long getCleanupIntervalMs() {
        return cleanupIntervalMs;
    }

    public void setCleanupIntervalMs(long cleanupIntervalMs) {
        this.cleanupIntervalMs = cleanupIntervalMs;
    }
}
