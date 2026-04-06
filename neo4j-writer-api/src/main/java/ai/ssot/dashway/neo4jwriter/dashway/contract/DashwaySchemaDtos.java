package ai.ssot.dashway.neo4jwriter.dashway.contract;

import ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.BatchWriteResponse;
import java.util.List;

public final class DashwaySchemaDtos {

    private DashwaySchemaDtos() {
    }

    public record ConceptUpsertRequest(
        String id,
        String name,
        String type,
        List<String> aliases,
        String summary,
        String status,
        String createdAt,
        String updatedAt
    ) {
    }

    public record PersonUpsertRequest(
        String id,
        String name,
        String email,
        String slackUserId,
        String githubLogin,
        String team,
        String createdAt,
        String updatedAt
    ) {
    }

    public record ChannelUpsertRequest(
        String id,
        String name
    ) {
    }

    public record RepoUpsertRequest(
        String id,
        String name,
        String org,
        String url
    ) {
    }

    public record ConceptLinkRequest(
        String conceptId,
        Double score,
        String extractedBy
    ) {
    }

    public record ReferenceTargetRequest(
        String label,
        String id
    ) {
    }

    public record SupportTargetRequest(
        String label,
        String id
    ) {
    }

    public record SlackMessageUpsertRequest(
        String id,
        String channelId,
        String channelName,
        String threadTs,
        String ts,
        String text,
        String permalink,
        String source,
        String createdAt,
        String updatedAt,
        String authorPersonId,
        String sentAt,
        String replyToMessageId,
        List<ConceptLinkRequest> concepts,
        List<ReferenceTargetRequest> references
    ) {
    }

    public record IssueUpsertRequest(
        String id,
        String provider,
        String repoId,
        String repoName,
        String repoOrg,
        Integer number,
        String title,
        String body,
        String state,
        String priority,
        String url,
        String createdAt,
        String updatedAt,
        String authorPersonId,
        String authoredAt,
        List<ConceptLinkRequest> concepts,
        List<String> blockedByIssueIds,
        List<ReferenceTargetRequest> references
    ) {
    }

    public record DocumentUpsertRequest(
        String id,
        String provider,
        String title,
        String bodyRef,
        String url,
        String docType,
        String version,
        String createdAt,
        String updatedAt,
        String editorPersonId,
        String editedAt,
        List<ConceptLinkRequest> concepts,
        List<ReferenceTargetRequest> references
    ) {
    }

    public record DecisionUpsertRequest(
        String id,
        String summary,
        String status,
        String decidedAt,
        Double confidence,
        String makerPersonId,
        String conceptId,
        List<SupportTargetRequest> supportedBy
    ) {
    }

    public record SchemaBatchIngestRequest(
        List<ConceptUpsertRequest> concepts,
        List<PersonUpsertRequest> people,
        List<ChannelUpsertRequest> channels,
        List<RepoUpsertRequest> repos,
        List<SlackMessageUpsertRequest> slackMessages,
        List<IssueUpsertRequest> issues,
        List<DocumentUpsertRequest> documents,
        List<DecisionUpsertRequest> decisions
    ) {
    }

    public record SchemaBootstrapResponse(
        List<String> constraints
    ) {
    }

    public record DomainWriteResponse(
        String entityType,
        String id,
        BatchWriteResponse graph
    ) {
    }
}
