package ai.ssot.dashway.neo4jwriter.ingest.application;

import ai.ssot.dashway.neo4jwriter.ingest.support.PermanentProcessingException;
import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public enum GraphEventType {
    CONCEPT_UPSERT("concept.upsert", "/api/dashway/concepts"),
    PERSON_UPSERT("person.upsert", "/api/dashway/people"),
    CHANNEL_UPSERT("channel.upsert", "/api/dashway/channels"),
    REPO_UPSERT("repo.upsert", "/api/dashway/repos"),
    SLACK_MESSAGE_UPSERT("slack.message.upsert", "/api/dashway/slack-messages"),
    ISSUE_UPSERT("issue.upsert", "/api/dashway/issues"),
    DOCUMENT_UPSERT("document.upsert", "/api/dashway/documents"),
    DECISION_UPSERT("decision.upsert", "/api/dashway/decisions"),
    DASHWAY_BATCH_INGEST("dashway.ingest.batch", "/api/dashway/ingest/batch");

    private static final Map<String, GraphEventType> LOOKUP = Arrays.stream(values())
        .collect(Collectors.toUnmodifiableMap(GraphEventType::eventType, Function.identity()));

    private final String eventType;
    private final String endpointPath;

    GraphEventType(String eventType, String endpointPath) {
        this.eventType = eventType;
        this.endpointPath = endpointPath;
    }

    public String eventType() {
        return eventType;
    }

    public String endpointPath() {
        return endpointPath;
    }

    public static GraphEventType from(String rawValue) {
        GraphEventType value = LOOKUP.get(rawValue);
        if (value == null) {
            throw new PermanentProcessingException("Unsupported eventType: " + rawValue);
        }
        return value;
    }
}
