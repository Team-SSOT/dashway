package ai.ssot.dashway.neo4jwriter.ingest.application;

import ai.ssot.dashway.neo4jwriter.common.exception.GraphEntityNotFoundException;
import ai.ssot.dashway.neo4jwriter.common.exception.InvalidGraphRequestException;
import ai.ssot.dashway.neo4jwriter.ingest.contract.DashwayGraphEvent;
import ai.ssot.dashway.neo4jwriter.ingest.idempotency.ProcessedEventStore;
import ai.ssot.dashway.neo4jwriter.ingest.support.PermanentProcessingException;
import ai.ssot.dashway.neo4jwriter.ingest.support.TransientProcessingException;
import org.neo4j.driver.exceptions.Neo4jException;
import org.neo4j.driver.exceptions.ServiceUnavailableException;
import org.neo4j.driver.exceptions.TransientException;
import org.springframework.stereotype.Service;

@Service
public class GraphIngestOrchestrator {

    private final ProcessedEventStore processedEventStore;
    private final DashwayGraphEventDispatcher eventDispatcher;

    public GraphIngestOrchestrator(ProcessedEventStore processedEventStore, DashwayGraphEventDispatcher eventDispatcher) {
        this.processedEventStore = processedEventStore;
        this.eventDispatcher = eventDispatcher;
    }

    public GraphIngestOutcome process(DashwayGraphEvent event) {
        validateEvent(event);

        if (processedEventStore.isProcessed(event.eventId())) {
            return new GraphIngestOutcome(
                event.eventId(),
                event.eventType(),
                GraphIngestOutcome.Status.DUPLICATE_SKIPPED,
                null
            );
        }

        GraphEventType eventType = GraphEventType.from(event.eventType());

        try {
            eventDispatcher.dispatch(eventType, event.payload());
            processedEventStore.markProcessed(event.eventId());
            return new GraphIngestOutcome(
                event.eventId(),
                event.eventType(),
                GraphIngestOutcome.Status.PROCESSED,
                eventType.endpointPath()
            );
        } catch (InvalidGraphRequestException | GraphEntityNotFoundException exception) {
            throw new PermanentProcessingException(exception.getMessage(), exception);
        } catch (TransientException | ServiceUnavailableException exception) {
            throw new TransientProcessingException(exception.getMessage(), exception);
        } catch (Neo4jException exception) {
            throw new PermanentProcessingException(exception.getMessage(), exception);
        }
    }

    private void validateEvent(DashwayGraphEvent event) {
        if (event == null) {
            throw new PermanentProcessingException("Queue event body is required.");
        }
        requireText(event.eventId(), "eventId");
        requireText(event.eventType(), "eventType");
        if (event.payload() == null || event.payload().isEmpty()) {
            throw new PermanentProcessingException("payload is required.");
        }
    }

    private void requireText(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new PermanentProcessingException(fieldName + " is required.");
        }
    }
}
