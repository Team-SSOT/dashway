package ai.ssot.dashway.neo4jwriter.dashway.application;

import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.ChannelUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.ConceptUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.DecisionUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.DocumentUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.DomainWriteResponse;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.IssueUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.PersonUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.RepoUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.SchemaBatchIngestRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.SchemaBootstrapResponse;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.SlackMessageUpsertRequest;

import ai.ssot.dashway.neo4jwriter.dashway.support.DashwayBatchFactory;
import ai.ssot.dashway.neo4jwriter.graph.application.GraphWriteService;
import ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.BatchWriteResponse;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DashwaySchemaService {

    private static final List<String> CONSTRAINTS = List.of(
        "CREATE CONSTRAINT concept_id IF NOT EXISTS FOR (n:Concept) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT person_id IF NOT EXISTS FOR (n:Person) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT slack_message_id IF NOT EXISTS FOR (n:SlackMessage) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT issue_id IF NOT EXISTS FOR (n:Issue) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT document_id IF NOT EXISTS FOR (n:Document) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT decision_id IF NOT EXISTS FOR (n:Decision) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT channel_id IF NOT EXISTS FOR (n:Channel) REQUIRE n.id IS UNIQUE",
        "CREATE CONSTRAINT repo_id IF NOT EXISTS FOR (n:Repo) REQUIRE n.id IS UNIQUE"
    );

    private final GraphWriteService graphWriteService;
    private final DashwayBatchFactory batchFactory;

    public DashwaySchemaService(GraphWriteService graphWriteService, DashwayBatchFactory batchFactory) {
        this.graphWriteService = graphWriteService;
        this.batchFactory = batchFactory;
    }

    public DomainWriteResponse upsertConcept(ConceptUpsertRequest request) {
        return new DomainWriteResponse("Concept", request.id(), graphWriteService.writeBatch(batchFactory.concept(request)));
    }

    public DomainWriteResponse upsertPerson(PersonUpsertRequest request) {
        return new DomainWriteResponse("Person", request.id(), graphWriteService.writeBatch(batchFactory.person(request)));
    }

    public DomainWriteResponse upsertChannel(ChannelUpsertRequest request) {
        return new DomainWriteResponse("Channel", request.id(), graphWriteService.writeBatch(batchFactory.channel(request)));
    }

    public DomainWriteResponse upsertRepo(RepoUpsertRequest request) {
        return new DomainWriteResponse("Repo", request.id(), graphWriteService.writeBatch(batchFactory.repo(request)));
    }

    public DomainWriteResponse upsertSlackMessage(SlackMessageUpsertRequest request) {
        return new DomainWriteResponse(
            "SlackMessage",
            request.id(),
            graphWriteService.writeBatch(batchFactory.slackMessage(request))
        );
    }

    public DomainWriteResponse upsertIssue(IssueUpsertRequest request) {
        return new DomainWriteResponse("Issue", request.id(), graphWriteService.writeBatch(batchFactory.issue(request)));
    }

    public DomainWriteResponse upsertDocument(DocumentUpsertRequest request) {
        return new DomainWriteResponse("Document", request.id(), graphWriteService.writeBatch(batchFactory.document(request)));
    }

    public DomainWriteResponse upsertDecision(DecisionUpsertRequest request) {
        return new DomainWriteResponse("Decision", request.id(), graphWriteService.writeBatch(batchFactory.decision(request)));
    }

    public BatchWriteResponse ingestBatch(SchemaBatchIngestRequest request) {
        return graphWriteService.writeBatch(batchFactory.schemaBatch(request));
    }

    public SchemaBootstrapResponse bootstrapSchema() {
        graphWriteService.executeStatements(CONSTRAINTS);
        return new SchemaBootstrapResponse(CONSTRAINTS);
    }
}
