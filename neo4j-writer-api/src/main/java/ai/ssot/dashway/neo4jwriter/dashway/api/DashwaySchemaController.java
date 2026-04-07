package ai.ssot.dashway.neo4jwriter.dashway.api;

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

import ai.ssot.dashway.neo4jwriter.dashway.application.DashwaySchemaService;
import ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.BatchWriteResponse;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashway")
public class DashwaySchemaController {

    private final DashwaySchemaService dashwaySchemaService;

    public DashwaySchemaController(DashwaySchemaService dashwaySchemaService) {
        this.dashwaySchemaService = dashwaySchemaService;
    }

    @PostMapping("/concepts")
    public DomainWriteResponse upsertConcept(@RequestBody ConceptUpsertRequest request) {
        return dashwaySchemaService.upsertConcept(request);
    }

    @PostMapping("/people")
    public DomainWriteResponse upsertPerson(@RequestBody PersonUpsertRequest request) {
        return dashwaySchemaService.upsertPerson(request);
    }

    @PostMapping("/channels")
    public DomainWriteResponse upsertChannel(@RequestBody ChannelUpsertRequest request) {
        return dashwaySchemaService.upsertChannel(request);
    }

    @PostMapping("/repos")
    public DomainWriteResponse upsertRepo(@RequestBody RepoUpsertRequest request) {
        return dashwaySchemaService.upsertRepo(request);
    }

    @PostMapping("/slack-messages")
    public DomainWriteResponse upsertSlackMessage(@RequestBody SlackMessageUpsertRequest request) {
        return dashwaySchemaService.upsertSlackMessage(request);
    }

    @PostMapping("/issues")
    public DomainWriteResponse upsertIssue(@RequestBody IssueUpsertRequest request) {
        return dashwaySchemaService.upsertIssue(request);
    }

    @PostMapping("/documents")
    public DomainWriteResponse upsertDocument(@RequestBody DocumentUpsertRequest request) {
        return dashwaySchemaService.upsertDocument(request);
    }

    @PostMapping("/decisions")
    public DomainWriteResponse upsertDecision(@RequestBody DecisionUpsertRequest request) {
        return dashwaySchemaService.upsertDecision(request);
    }

    @PostMapping("/ingest/batch")
    public BatchWriteResponse ingestBatch(@RequestBody SchemaBatchIngestRequest request) {
        return dashwaySchemaService.ingestBatch(request);
    }

    @PostMapping("/admin/bootstrap")
    public SchemaBootstrapResponse bootstrapSchema() {
        return dashwaySchemaService.bootstrapSchema();
    }
}
