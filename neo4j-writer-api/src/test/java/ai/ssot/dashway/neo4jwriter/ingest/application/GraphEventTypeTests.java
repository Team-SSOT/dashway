package ai.ssot.dashway.neo4jwriter.ingest.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import ai.ssot.dashway.neo4jwriter.ingest.support.PermanentProcessingException;
import org.junit.jupiter.api.Test;

class GraphEventTypeTests {

    @Test
    void resolveKnownEventType() {
        GraphEventType eventType = GraphEventType.from("slack.message.upsert");

        assertThat(eventType.endpointPath()).isEqualTo("/api/dashway/slack-messages");
    }

    @Test
    void rejectUnknownEventType() {
        assertThatThrownBy(() -> GraphEventType.from("unknown.event"))
            .isInstanceOf(PermanentProcessingException.class)
            .hasMessageContaining("Unsupported eventType");
    }
}
