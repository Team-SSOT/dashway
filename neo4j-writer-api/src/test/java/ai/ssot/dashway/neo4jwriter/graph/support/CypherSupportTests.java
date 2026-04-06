package ai.ssot.dashway.neo4jwriter.graph.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import ai.ssot.dashway.neo4jwriter.common.exception.InvalidGraphRequestException;
import ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class CypherSupportTests {

    @Test
    void rejectInvalidCypherIdentifiers() {
        assertThatThrownBy(() -> CypherSupport.validateIdentifier("Concept-Node", "label"))
            .isInstanceOf(InvalidGraphRequestException.class)
            .hasMessageContaining("label must match");
    }

    @Test
    void rejectNestedObjectProperties() {
        assertThatThrownBy(() -> CypherSupport.normalizePropertyMap(Map.of("meta", Map.of("team", "platform")), "properties", true))
            .isInstanceOf(InvalidGraphRequestException.class)
            .hasMessageContaining("Nested objects are not supported");
    }

    @Test
    void buildMatchClauseWithStableParameters() {
        LinkedHashMap<String, Object> match = new LinkedHashMap<>();
        match.put("id", "concept-billing-retry");
        match.put("status", "active");

        var target = CypherSupport.normalizeMatchTarget(new GraphDtos.NodeMatchRequest("Concept", match), "from");
        var fragment = CypherSupport.buildMatchClause("source", target, "from");

        assertThat(fragment.cypher())
            .isEqualTo("MATCH (source:`Concept`) WHERE source.`id` = $from_id AND source.`status` = $from_status");
        assertThat(fragment.parameters())
            .containsEntry("from_id", "concept-billing-retry")
            .containsEntry("from_status", "active");
    }
}
