package ai.ssot.dashway.neo4jwriter.health.api;

import ai.ssot.dashway.neo4jwriter.graph.application.GraphWriteService;
import ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.HealthResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final GraphWriteService graphWriteService;

    public HealthController(GraphWriteService graphWriteService) {
        this.graphWriteService = graphWriteService;
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return graphWriteService.health();
    }
}
