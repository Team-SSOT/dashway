package ai.ssot.dashway.neo4jwriter.dashway.support;

import static org.assertj.core.api.Assertions.assertThat;

import ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.ConceptLinkRequest;
import ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.DecisionUpsertRequest;
import ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.ReferenceTargetRequest;
import ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.SlackMessageUpsertRequest;
import ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.SupportTargetRequest;
import java.util.List;
import org.junit.jupiter.api.Test;

class DashwayBatchFactoryTests {

    private final DashwayBatchFactory batchFactory = new DashwayBatchFactory();

    @Test
    void mapSlackMessageToDashwayGraphBatch() {
        var request = new SlackMessageUpsertRequest(
            "slack-1",
            "channel-eng",
            "eng",
            "1712000000.000001",
            "1712000000.000001",
            "Billing retry discussion",
            "https://slack.example/message/1",
            "slack",
            "2026-04-04T13:00:00Z",
            "2026-04-04T13:01:00Z",
            "person-jay",
            null,
            "slack-parent",
            List.of(new ConceptLinkRequest("concept-billing-retry", 0.95, "llm")),
            List.of(new ReferenceTargetRequest("Issue", "issue-1"))
        );

        var batch = batchFactory.slackMessage(request);

        assertThat(batch.nodes()).extracting(node -> node.label())
            .contains("SlackMessage", "Channel", "Person", "Concept", "Issue");
        assertThat(batch.relationships()).extracting(relationship -> relationship.type())
            .contains("IN_CHANNEL", "SENT", "REPLY_TO", "ABOUT", "REFERENCES");
    }

    @Test
    void mapDecisionToConceptAndEvidenceRelationships() {
        var request = new DecisionUpsertRequest(
            "decision-1",
            "Use Neo4j as the concept graph",
            "accepted",
            "2026-04-04T13:30:00Z",
            0.91,
            "person-jay",
            "concept-team-context-graph",
            List.of(
                new SupportTargetRequest("Document", "doc-rfc-1"),
                new SupportTargetRequest("Issue", "issue-1")
            )
        );

        var batch = batchFactory.decision(request);

        assertThat(batch.nodes()).extracting(node -> node.label())
            .contains("Decision", "Person", "Concept", "Document", "Issue");
        assertThat(batch.relationships()).extracting(relationship -> relationship.type())
            .contains("MADE", "ABOUT", "SUPPORTED_BY");
    }
}
