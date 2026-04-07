package ai.ssot.dashway.neo4jwriter.ingest.application;

import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.ChannelUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.ConceptUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.DecisionUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.DocumentUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.IssueUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.PersonUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.RepoUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.SchemaBatchIngestRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.SlackMessageUpsertRequest;

import ai.ssot.dashway.neo4jwriter.dashway.application.DashwaySchemaService;
import ai.ssot.dashway.neo4jwriter.ingest.support.PermanentProcessingException;
import java.util.Map;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class DashwayGraphEventDispatcher {

    private final ObjectMapper objectMapper;
    private final DashwaySchemaService dashwaySchemaService;

    public DashwayGraphEventDispatcher(ObjectMapper objectMapper, DashwaySchemaService dashwaySchemaService) {
        this.objectMapper = objectMapper;
        this.dashwaySchemaService = dashwaySchemaService;
    }

    public void dispatch(GraphEventType eventType, Map<String, Object> payload) {
        switch (eventType) {
            case CONCEPT_UPSERT -> dashwaySchemaService.upsertConcept(convert(payload, ConceptUpsertRequest.class, eventType));
            case PERSON_UPSERT -> dashwaySchemaService.upsertPerson(convert(payload, PersonUpsertRequest.class, eventType));
            case CHANNEL_UPSERT -> dashwaySchemaService.upsertChannel(convert(payload, ChannelUpsertRequest.class, eventType));
            case REPO_UPSERT -> dashwaySchemaService.upsertRepo(convert(payload, RepoUpsertRequest.class, eventType));
            case SLACK_MESSAGE_UPSERT -> dashwaySchemaService.upsertSlackMessage(
                convert(payload, SlackMessageUpsertRequest.class, eventType)
            );
            case ISSUE_UPSERT -> dashwaySchemaService.upsertIssue(convert(payload, IssueUpsertRequest.class, eventType));
            case DOCUMENT_UPSERT -> dashwaySchemaService.upsertDocument(convert(payload, DocumentUpsertRequest.class, eventType));
            case DECISION_UPSERT -> dashwaySchemaService.upsertDecision(convert(payload, DecisionUpsertRequest.class, eventType));
            case DASHWAY_BATCH_INGEST -> dashwaySchemaService.ingestBatch(
                convert(payload, SchemaBatchIngestRequest.class, eventType)
            );
        }
    }

    private <T> T convert(Map<String, Object> payload, Class<T> targetType, GraphEventType eventType) {
        try {
            return objectMapper.convertValue(payload, targetType);
        } catch (IllegalArgumentException exception) {
            throw new PermanentProcessingException(
                "Invalid payload for eventType " + eventType.eventType() + ": " + exception.getMessage(),
                exception
            );
        }
    }
}
