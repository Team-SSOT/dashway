package ai.ssot.dashway.neo4jwriter.graph.application;

import static ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.BatchWriteRequest;
import static ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.BatchWriteResponse;
import static ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.HealthResponse;
import static ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.NodeMatchRequest;
import static ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.NodeUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.NodeWriteResponse;
import static ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.RelationshipUpsertRequest;
import static ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos.RelationshipWriteResponse;

import ai.ssot.dashway.neo4jwriter.common.exception.GraphEntityNotFoundException;
import ai.ssot.dashway.neo4jwriter.common.exception.InvalidGraphRequestException;
import ai.ssot.dashway.neo4jwriter.common.exception.Neo4jUnavailableException;
import ai.ssot.dashway.neo4jwriter.config.Neo4jConnectionProperties;
import ai.ssot.dashway.neo4jwriter.graph.support.CypherSupport;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import org.neo4j.driver.AccessMode;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Record;
import org.neo4j.driver.Session;
import org.neo4j.driver.SessionConfig;
import org.neo4j.driver.TransactionContext;
import org.springframework.stereotype.Service;

@Service
public class GraphWriteService {

    private final Driver driver;
    private final Neo4jConnectionProperties properties;

    public GraphWriteService(Driver driver, Neo4jConnectionProperties properties) {
        this.driver = driver;
        this.properties = properties;
    }

    public HealthResponse health() {
        try (Session session = openSession(AccessMode.READ)) {
            session.executeRead(tx -> tx.run("RETURN 1 AS ok").single());
            return new HealthResponse("ok", properties.getDatabase(), properties.getUri());
        } catch (RuntimeException exception) {
            throw new Neo4jUnavailableException("Neo4j health check failed.", exception);
        }
    }

    public NodeWriteResponse upsertNode(NodeUpsertRequest request) {
        return executeWrite(tx -> writeNode(tx, request));
    }

    public RelationshipWriteResponse upsertRelationship(RelationshipUpsertRequest request) {
        return executeWrite(tx -> writeRelationship(tx, request));
    }

    public BatchWriteResponse writeBatch(BatchWriteRequest request) {
        List<NodeUpsertRequest> nodes = request == null || request.nodes() == null ? List.of() : request.nodes();
        List<RelationshipUpsertRequest> relationships = request == null || request.relationships() == null
            ? List.of()
            : request.relationships();

        if (nodes.isEmpty() && relationships.isEmpty()) {
            throw new InvalidGraphRequestException("At least one node or relationship is required.");
        }

        return executeWrite(tx -> {
            List<NodeWriteResponse> nodeResponses = new ArrayList<>(nodes.size());
            for (NodeUpsertRequest node : nodes) {
                nodeResponses.add(writeNode(tx, node));
            }

            List<RelationshipWriteResponse> relationshipResponses = new ArrayList<>(relationships.size());
            for (RelationshipUpsertRequest relationship : relationships) {
                relationshipResponses.add(writeRelationship(tx, relationship));
            }

            return new BatchWriteResponse(nodeResponses, relationshipResponses);
        });
    }

    public List<String> executeStatements(List<String> statements) {
        if (statements == null || statements.isEmpty()) {
            throw new InvalidGraphRequestException("At least one Cypher statement is required.");
        }

        return executeWrite(tx -> {
            List<String> executed = new ArrayList<>();
            for (String statement : statements) {
                if (statement == null || statement.isBlank()) {
                    continue;
                }
                tx.run(statement).consume();
                executed.add(statement);
            }

            if (executed.isEmpty()) {
                throw new InvalidGraphRequestException("At least one non-empty Cypher statement is required.");
            }
            return List.copyOf(executed);
        });
    }

    private NodeWriteResponse writeNode(TransactionContext tx, NodeUpsertRequest request) {
        if (request == null) {
            throw new InvalidGraphRequestException("Request body is required.");
        }

        String label = CypherSupport.validateIdentifier(request.label(), "label");
        String keyProperty = CypherSupport.validateIdentifier(request.keyProperty(), "keyProperty");
        Object keyValue = CypherSupport.normalizePropertyValue(request.keyValue(), "keyValue");
        LinkedHashMap<String, Object> propertiesMap = CypherSupport.normalizePropertyMap(request.properties(), "properties", true);

        if (propertiesMap.containsKey(keyProperty) && !Objects.equals(propertiesMap.get(keyProperty), keyValue)) {
            throw new InvalidGraphRequestException("properties." + keyProperty + " must match keyValue when both are provided.");
        }

        propertiesMap.put(keyProperty, keyValue);

        String cypher = """
            MERGE (n:%s {%s: $keyValue})
            SET n += $properties
            RETURN properties(n) AS properties
            """.formatted(
            CypherSupport.quoteIdentifier(label),
            CypherSupport.quoteIdentifier(keyProperty)
        );

        Record record = tx.run(cypher, Map.of("keyValue", keyValue, "properties", propertiesMap)).single();
        return new NodeWriteResponse(label, keyProperty, keyValue, new LinkedHashMap<>(record.get("properties").asMap()));
    }

    private RelationshipWriteResponse writeRelationship(TransactionContext tx, RelationshipUpsertRequest request) {
        if (request == null) {
            throw new InvalidGraphRequestException("Request body is required.");
        }

        CypherSupport.MatchTarget from = CypherSupport.normalizeMatchTarget(request.from(), "from");
        CypherSupport.MatchTarget to = CypherSupport.normalizeMatchTarget(request.to(), "to");
        String type = CypherSupport.validateIdentifier(request.type(), "type");
        LinkedHashMap<String, Object> propertiesMap = CypherSupport.normalizePropertyMap(request.properties(), "properties", true);

        CypherSupport.QueryFragment fromClause = CypherSupport.buildMatchClause("source", from, "from");
        CypherSupport.QueryFragment toClause = CypherSupport.buildMatchClause("target", to, "to");

        LinkedHashMap<String, Object> parameters = new LinkedHashMap<>();
        parameters.putAll(fromClause.parameters());
        parameters.putAll(toClause.parameters());
        parameters.put("properties", propertiesMap);

        String cypher = fromClause.cypher()
            + "\n"
            + toClause.cypher()
            + "\nMERGE (source)-[r:"
            + CypherSupport.quoteIdentifier(type)
            + "]->(target)\nSET r += $properties\nRETURN properties(r) AS properties";

        var result = tx.run(cypher, parameters);
        if (!result.hasNext()) {
            throw new GraphEntityNotFoundException("Could not match source or target node for relationship creation.");
        }

        Record record = result.next();
        return new RelationshipWriteResponse(
            type,
            new NodeMatchRequest(from.label(), from.match()),
            new NodeMatchRequest(to.label(), to.match()),
            new LinkedHashMap<>(record.get("properties").asMap())
        );
    }

    private <T> T executeWrite(Function<TransactionContext, T> callback) {
        try (Session session = openSession(AccessMode.WRITE)) {
            return session.executeWrite(callback::apply);
        }
    }

    private Session openSession(AccessMode accessMode) {
        return driver.session(
            SessionConfig.builder()
                .withDatabase(properties.getDatabase())
                .withDefaultAccessMode(accessMode)
                .build()
        );
    }
}
