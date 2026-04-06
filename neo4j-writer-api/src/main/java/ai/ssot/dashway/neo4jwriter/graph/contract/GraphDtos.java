package ai.ssot.dashway.neo4jwriter.graph.contract;

import java.util.List;
import java.util.Map;

public final class GraphDtos {

    private GraphDtos() {
    }

    public record NodeUpsertRequest(
        String label,
        String keyProperty,
        Object keyValue,
        Map<String, Object> properties
    ) {
    }

    public record NodeMatchRequest(
        String label,
        Map<String, Object> match
    ) {
    }

    public record RelationshipUpsertRequest(
        NodeMatchRequest from,
        NodeMatchRequest to,
        String type,
        Map<String, Object> properties
    ) {
    }

    public record BatchWriteRequest(
        List<NodeUpsertRequest> nodes,
        List<RelationshipUpsertRequest> relationships
    ) {
    }

    public record NodeWriteResponse(
        String label,
        String keyProperty,
        Object keyValue,
        Map<String, Object> properties
    ) {
    }

    public record RelationshipWriteResponse(
        String type,
        NodeMatchRequest from,
        NodeMatchRequest to,
        Map<String, Object> properties
    ) {
    }

    public record BatchWriteResponse(
        List<NodeWriteResponse> nodes,
        List<RelationshipWriteResponse> relationships
    ) {
    }

    public record HealthResponse(
        String status,
        String database,
        String uri
    ) {
    }

}
