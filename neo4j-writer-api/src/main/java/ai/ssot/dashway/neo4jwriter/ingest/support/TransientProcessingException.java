package ai.ssot.dashway.neo4jwriter.ingest.support;

public class TransientProcessingException extends RuntimeException {

    public TransientProcessingException(String message) {
        super(message);
    }

    public TransientProcessingException(String message, Throwable cause) {
        super(message, cause);
    }
}
