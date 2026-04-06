package ai.ssot.dashway.neo4jwriter.graph.api;

import ai.ssot.dashway.neo4jwriter.graph.application.GraphWriteService;
import ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.BatchWriteRequest;
import ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.BatchWriteResponse;
import ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.NodeUpsertRequest;
import ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.NodeWriteResponse;
import ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.RelationshipUpsertRequest;
import ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.RelationshipWriteResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/graph")
public class GraphWriteController {

    private final GraphWriteService graphWriteService;

    public GraphWriteController(GraphWriteService graphWriteService) {
        this.graphWriteService = graphWriteService;
    }

    @PostMapping("/nodes")
    public NodeWriteResponse upsertNode(@RequestBody NodeUpsertRequest request) {
        return graphWriteService.upsertNode(request);
    }

    @PostMapping("/relationships")
    public RelationshipWriteResponse upsertRelationship(@RequestBody RelationshipUpsertRequest request) {
        return graphWriteService.upsertRelationship(request);
    }

    @PostMapping("/batch")
    public BatchWriteResponse writeBatch(@RequestBody BatchWriteRequest request) {
        return graphWriteService.writeBatch(request);
    }
}
