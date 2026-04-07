package ai.ssot.dashway.neo4jwriter.ingest.support;

import java.util.Map;

public final class GraphMessageHeaders {

    public static final String ATTEMPT = "x-dashway-attempt";
    public static final String FAILURE_REASON = "x-dashway-failure-reason";
    public static final String ORIGINAL_EVENT_ID = "x-dashway-event-id";
    public static final String ORIGINAL_EVENT_TYPE = "x-dashway-event-type";

    private GraphMessageHeaders() {
    }

    public static int readAttempt(Map<String, Object> headers) {
        Object rawValue = headers.get(ATTEMPT);
        if (rawValue instanceof Number number) {
            return number.intValue();
        }
        if (rawValue instanceof String text) {
            try {
                return Integer.parseInt(text);
            } catch (NumberFormatException ignored) {
                return 1;
            }
        }
        return 1;
    }
}
