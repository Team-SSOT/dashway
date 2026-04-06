package ai.ssot.dashway.neo4jwriter.dashway.support;

import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.ChannelUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.ConceptLinkRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.ConceptUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.DecisionUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.DocumentUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.IssueUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.PersonUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.ReferenceTargetRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.RepoUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.SchemaBatchIngestRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.SlackMessageUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.dashway.contract.DashwaySchemaDtos.SupportTargetRequest;

import ai.ssot.dashway.neo4jwriter.common.exception.InvalidGraphRequestException;
import ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.BatchWriteRequest;
import ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.NodeMatchRequest;
import ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.NodeUpsertRequest;
import ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.RelationshipUpsertRequest;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class DashwayBatchFactory {

    private static final Set<String> REFERENCE_TARGET_LABELS = Set.of(
        "Issue",
        "Document",
        "SlackMessage",
        "PullRequest",
        "Commit",
        "File"
    );

    private static final Set<String> SUPPORT_TARGET_LABELS = Set.of(
        "SlackMessage",
        "Document",
        "Issue"
    );

    private static final Set<String> STUB_CAPABLE_LABELS = Set.of(
        "Concept",
        "Person",
        "SlackMessage",
        "Issue",
        "Document",
        "Decision",
        "Repo",
        "Channel",
        "PullRequest",
        "Commit",
        "File"
    );

    public BatchWriteRequest concept(ConceptUpsertRequest request) {
        request = requireRequest(request, "concept");
        requireText(request.id(), "concept.id");
        requireText(request.name(), "concept.name");

        DashwayWriteBuilder builder = new DashwayWriteBuilder();
        builder.addNode(
            "Concept",
            "id",
            request.id(),
            PropertyMapBuilder.create()
                .put("name", request.name())
                .put("type", request.type())
                .putStrings("aliases", request.aliases())
                .put("summary", request.summary())
                .put("status", request.status())
                .put("createdAt", request.createdAt())
                .put("updatedAt", request.updatedAt())
                .build()
        );
        return builder.build();
    }

    public BatchWriteRequest person(PersonUpsertRequest request) {
        request = requireRequest(request, "person");
        requireText(request.id(), "person.id");
        requireText(request.name(), "person.name");

        DashwayWriteBuilder builder = new DashwayWriteBuilder();
        builder.addNode(
            "Person",
            "id",
            request.id(),
            PropertyMapBuilder.create()
                .put("name", request.name())
                .put("email", request.email())
                .put("slackUserId", request.slackUserId())
                .put("githubLogin", request.githubLogin())
                .put("team", request.team())
                .put("createdAt", request.createdAt())
                .put("updatedAt", request.updatedAt())
                .build()
        );
        return builder.build();
    }

    public BatchWriteRequest channel(ChannelUpsertRequest request) {
        request = requireRequest(request, "channel");
        requireText(request.id(), "channel.id");

        DashwayWriteBuilder builder = new DashwayWriteBuilder();
        builder.addNode(
            "Channel",
            "id",
            request.id(),
            PropertyMapBuilder.create()
                .put("name", request.name())
                .build()
        );
        return builder.build();
    }

    public BatchWriteRequest repo(RepoUpsertRequest request) {
        request = requireRequest(request, "repo");
        requireText(request.id(), "repo.id");
        requireText(request.name(), "repo.name");

        DashwayWriteBuilder builder = new DashwayWriteBuilder();
        builder.addNode(
            "Repo",
            "id",
            request.id(),
            PropertyMapBuilder.create()
                .put("name", request.name())
                .put("org", request.org())
                .put("url", request.url())
                .build()
        );
        return builder.build();
    }

    public BatchWriteRequest slackMessage(SlackMessageUpsertRequest request) {
        request = requireRequest(request, "slackMessage");
        requireText(request.id(), "slackMessage.id");

        DashwayWriteBuilder builder = new DashwayWriteBuilder();
        builder.addNode(
            "SlackMessage",
            "id",
            request.id(),
            PropertyMapBuilder.create()
                .put("channelId", request.channelId())
                .put("threadTs", request.threadTs())
                .put("ts", request.ts())
                .put("text", request.text())
                .put("permalink", request.permalink())
                .put("source", request.source())
                .put("createdAt", request.createdAt())
                .put("updatedAt", request.updatedAt())
                .build()
        );

        if (hasText(request.channelId())) {
            builder.addNode(
                "Channel",
                "id",
                request.channelId(),
                PropertyMapBuilder.create().put("name", request.channelName()).build()
            );
            builder.addRelationship("SlackMessage", request.id(), "Channel", request.channelId(), "IN_CHANNEL", Map.of());
        }

        if (hasText(request.authorPersonId())) {
            builder.addStubNode("Person", request.authorPersonId());
            builder.addRelationship(
                "Person",
                request.authorPersonId(),
                "SlackMessage",
                request.id(),
                "SENT",
                PropertyMapBuilder.create()
                    .put("at", firstNonBlank(request.sentAt(), request.ts(), request.createdAt()))
                    .build()
            );
        }

        if (hasText(request.replyToMessageId())) {
            builder.addStubNode("SlackMessage", request.replyToMessageId());
            builder.addRelationship("SlackMessage", request.id(), "SlackMessage", request.replyToMessageId(), "REPLY_TO", Map.of());
        }

        addConceptLinks(builder, "SlackMessage", request.id(), request.concepts());
        addReferenceLinks(builder, "SlackMessage", request.id(), request.references());
        return builder.build();
    }

    public BatchWriteRequest issue(IssueUpsertRequest request) {
        request = requireRequest(request, "issue");
        requireText(request.id(), "issue.id");
        requireText(request.title(), "issue.title");

        DashwayWriteBuilder builder = new DashwayWriteBuilder();
        builder.addNode(
            "Issue",
            "id",
            request.id(),
            PropertyMapBuilder.create()
                .put("provider", request.provider())
                .put("repo", firstNonBlank(request.repoId(), request.repoName()))
                .put("number", request.number())
                .put("title", request.title())
                .put("body", request.body())
                .put("state", request.state())
                .put("priority", request.priority())
                .put("url", request.url())
                .put("createdAt", request.createdAt())
                .put("updatedAt", request.updatedAt())
                .build()
        );

        if (hasText(request.repoId())) {
            builder.addNode(
                "Repo",
                "id",
                request.repoId(),
                PropertyMapBuilder.create()
                    .put("name", request.repoName())
                    .put("org", request.repoOrg())
                    .build()
            );
            builder.addRelationship("Issue", request.id(), "Repo", request.repoId(), "IN_REPO", Map.of());
        }

        if (hasText(request.authorPersonId())) {
            builder.addStubNode("Person", request.authorPersonId());
            builder.addRelationship(
                "Person",
                request.authorPersonId(),
                "Issue",
                request.id(),
                "AUTHORED",
                PropertyMapBuilder.create()
                    .put("at", firstNonBlank(request.authoredAt(), request.createdAt()))
                    .build()
            );
        }

        addConceptLinks(builder, "Issue", request.id(), request.concepts());
        addReferenceLinks(builder, "Issue", request.id(), request.references());

        if (request.blockedByIssueIds() != null) {
            for (String blockedById : request.blockedByIssueIds()) {
                if (!hasText(blockedById)) {
                    continue;
                }
                builder.addStubNode("Issue", blockedById);
                builder.addRelationship("Issue", request.id(), "Issue", blockedById, "BLOCKED_BY", Map.of());
            }
        }

        return builder.build();
    }

    public BatchWriteRequest document(DocumentUpsertRequest request) {
        request = requireRequest(request, "document");
        requireText(request.id(), "document.id");
        requireText(request.title(), "document.title");

        DashwayWriteBuilder builder = new DashwayWriteBuilder();
        builder.addNode(
            "Document",
            "id",
            request.id(),
            PropertyMapBuilder.create()
                .put("provider", request.provider())
                .put("title", request.title())
                .put("bodyRef", request.bodyRef())
                .put("url", request.url())
                .put("docType", request.docType())
                .put("version", request.version())
                .put("createdAt", request.createdAt())
                .put("updatedAt", request.updatedAt())
                .build()
        );

        if (hasText(request.editorPersonId())) {
            builder.addStubNode("Person", request.editorPersonId());
            builder.addRelationship(
                "Person",
                request.editorPersonId(),
                "Document",
                request.id(),
                "EDITED",
                PropertyMapBuilder.create()
                    .put("at", firstNonBlank(request.editedAt(), request.updatedAt(), request.createdAt()))
                    .build()
            );
        }

        addConceptLinks(builder, "Document", request.id(), request.concepts());
        addReferenceLinks(builder, "Document", request.id(), request.references());
        return builder.build();
    }

    public BatchWriteRequest decision(DecisionUpsertRequest request) {
        request = requireRequest(request, "decision");
        requireText(request.id(), "decision.id");
        requireText(request.summary(), "decision.summary");

        DashwayWriteBuilder builder = new DashwayWriteBuilder();
        builder.addNode(
            "Decision",
            "id",
            request.id(),
            PropertyMapBuilder.create()
                .put("summary", request.summary())
                .put("status", request.status())
                .put("decidedAt", request.decidedAt())
                .put("confidence", request.confidence())
                .build()
        );

        if (hasText(request.makerPersonId())) {
            builder.addStubNode("Person", request.makerPersonId());
            builder.addRelationship("Person", request.makerPersonId(), "Decision", request.id(), "MADE", Map.of());
        }

        if (hasText(request.conceptId())) {
            builder.addStubNode("Concept", request.conceptId());
            builder.addRelationship("Decision", request.id(), "Concept", request.conceptId(), "ABOUT", Map.of());
        }

        if (request.supportedBy() != null) {
            for (SupportTargetRequest supportTarget : request.supportedBy()) {
                if (supportTarget == null) {
                    continue;
                }
                String label = requireAllowedLabel(supportTarget.label(), SUPPORT_TARGET_LABELS, "decision.supportedBy.label");
                String id = requireText(supportTarget.id(), "decision.supportedBy.id");
                builder.addStubNode(label, id);
                builder.addRelationship("Decision", request.id(), label, id, "SUPPORTED_BY", Map.of());
            }
        }

        return builder.build();
    }

    public BatchWriteRequest schemaBatch(SchemaBatchIngestRequest request) {
        if (request == null) {
            throw new InvalidGraphRequestException("Request body is required.");
        }

        List<NodeUpsertRequest> nodes = new ArrayList<>();
        List<RelationshipUpsertRequest> relationships = new ArrayList<>();

        append(nodes, relationships, request.concepts(), this::concept);
        append(nodes, relationships, request.people(), this::person);
        append(nodes, relationships, request.channels(), this::channel);
        append(nodes, relationships, request.repos(), this::repo);
        append(nodes, relationships, request.slackMessages(), this::slackMessage);
        append(nodes, relationships, request.issues(), this::issue);
        append(nodes, relationships, request.documents(), this::document);
        append(nodes, relationships, request.decisions(), this::decision);

        if (nodes.isEmpty() && relationships.isEmpty()) {
            throw new InvalidGraphRequestException("At least one Dashway entity is required.");
        }

        return new BatchWriteRequest(List.copyOf(nodes), List.copyOf(relationships));
    }

    private void addConceptLinks(
        DashwayWriteBuilder builder,
        String sourceLabel,
        String sourceId,
        List<ConceptLinkRequest> conceptLinks
    ) {
        if (conceptLinks == null) {
            return;
        }

        for (ConceptLinkRequest conceptLink : conceptLinks) {
            if (conceptLink == null) {
                continue;
            }

            String conceptId = requireText(conceptLink.conceptId(), sourceLabel + ".concepts.conceptId");
            builder.addStubNode("Concept", conceptId);
            builder.addRelationship(
                sourceLabel,
                sourceId,
                "Concept",
                conceptId,
                "ABOUT",
                PropertyMapBuilder.create()
                    .put("score", conceptLink.score())
                    .put("extractedBy", conceptLink.extractedBy())
                    .build()
            );
        }
    }

    private void addReferenceLinks(
        DashwayWriteBuilder builder,
        String sourceLabel,
        String sourceId,
        List<ReferenceTargetRequest> references
    ) {
        if (references == null) {
            return;
        }

        for (ReferenceTargetRequest reference : references) {
            if (reference == null) {
                continue;
            }

            String label = requireAllowedLabel(reference.label(), REFERENCE_TARGET_LABELS, sourceLabel + ".references.label");
            String id = requireText(reference.id(), sourceLabel + ".references.id");
            builder.addStubNode(label, id);
            builder.addRelationship(sourceLabel, sourceId, label, id, "REFERENCES", Map.of());
        }
    }

    private <T> void append(
        List<NodeUpsertRequest> nodes,
        List<RelationshipUpsertRequest> relationships,
        List<T> requests,
        java.util.function.Function<T, BatchWriteRequest> mapper
    ) {
        if (requests == null) {
            return;
        }

        for (T request : requests) {
            if (request == null) {
                continue;
            }
            BatchWriteRequest batch = mapper.apply(request);
            nodes.addAll(batch.nodes());
            relationships.addAll(batch.relationships());
        }
    }

    private static <T> T requireRequest(T request, String fieldName) {
        if (request == null) {
            throw new InvalidGraphRequestException(fieldName + " request is required.");
        }
        return request;
    }

    private static String requireAllowedLabel(String value, Set<String> allowed, String fieldName) {
        String label = requireText(value, fieldName);
        if (!allowed.contains(label)) {
            throw new InvalidGraphRequestException(fieldName + " must be one of " + allowed + ".");
        }
        return label;
    }

    private static String requireText(String value, String fieldName) {
        if (!hasText(value)) {
            throw new InvalidGraphRequestException(fieldName + " is required.");
        }
        return value;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (hasText(value)) {
                return value;
            }
        }
        return null;
    }

    private static final class DashwayWriteBuilder {

        private final List<NodeUpsertRequest> nodes = new ArrayList<>();
        private final List<RelationshipUpsertRequest> relationships = new ArrayList<>();

        void addNode(String label, String keyProperty, Object keyValue, Map<String, Object> properties) {
            nodes.add(new NodeUpsertRequest(label, keyProperty, keyValue, properties));
        }

        void addStubNode(String label, String id) {
            if (!STUB_CAPABLE_LABELS.contains(label)) {
                throw new InvalidGraphRequestException("Unsupported stub label: " + label);
            }
            addNode(label, "id", id, Map.of());
        }

        void addRelationship(
            String fromLabel,
            String fromId,
            String toLabel,
            String toId,
            String type,
            Map<String, Object> properties
        ) {
            relationships.add(
                new RelationshipUpsertRequest(
                    new NodeMatchRequest(fromLabel, Map.of("id", fromId)),
                    new NodeMatchRequest(toLabel, Map.of("id", toId)),
                    type,
                    properties
                )
            );
        }

        BatchWriteRequest build() {
            return new BatchWriteRequest(List.copyOf(nodes), List.copyOf(relationships));
        }
    }

    private static final class PropertyMapBuilder {

        private final LinkedHashMap<String, Object> properties = new LinkedHashMap<>();

        static PropertyMapBuilder create() {
            return new PropertyMapBuilder();
        }

        PropertyMapBuilder put(String key, String value) {
            if (hasText(value)) {
                properties.put(key, value);
            }
            return this;
        }

        PropertyMapBuilder put(String key, Number value) {
            if (value != null) {
                properties.put(key, value);
            }
            return this;
        }

        PropertyMapBuilder putStrings(String key, List<String> values) {
            if (values == null) {
                return this;
            }

            List<String> filtered = new ArrayList<>();
            for (String value : values) {
                if (hasText(value)) {
                    filtered.add(value);
                }
            }

            if (!filtered.isEmpty()) {
                properties.put(key, List.copyOf(filtered));
            }
            return this;
        }

        Map<String, Object> build() {
            return new LinkedHashMap<>(properties);
        }
    }
}
