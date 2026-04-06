package ai.ssot.dashway.neo4jwriter.ingest.idempotency;

import static org.assertj.core.api.Assertions.assertThat;

import ai.ssot.dashway.neo4jwriter.ingest.config.IngestIdempotencyProperties;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class InMemoryProcessedEventStoreTests {

    @Test
    void expireProcessedEventsAfterTtl() {
        IngestIdempotencyProperties properties = new IngestIdempotencyProperties();
        properties.setTtlMs(1_000);
        properties.setCleanupIntervalMs(1_000);

        Clock initialClock = Clock.fixed(Instant.parse("2026-04-04T00:00:00Z"), ZoneOffset.UTC);
        MutableClock clock = new MutableClock(initialClock.instant(), ZoneOffset.UTC);
        InMemoryProcessedEventStore store = new InMemoryProcessedEventStore(properties, clock);
        store.markProcessed("evt-1");

        assertThat(store.isProcessed("evt-1")).isTrue();

        clock.setInstant(Instant.parse("2026-04-04T00:00:02Z"));
        assertThat(store.isProcessed("evt-1")).isFalse();
    }

    private static final class MutableClock extends Clock {

        private Instant instant;
        private final ZoneId zoneId;

        private MutableClock(Instant instant, ZoneId zoneId) {
            this.instant = instant;
            this.zoneId = zoneId;
        }

        void setInstant(Instant instant) {
            this.instant = instant;
        }

        @Override
        public ZoneId getZone() {
            return zoneId;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return new MutableClock(instant, zone);
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
