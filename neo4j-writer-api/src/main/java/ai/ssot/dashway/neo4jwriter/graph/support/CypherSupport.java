package ai.ssot.dashway.neo4jwriter.graph.support;

import ai.ssot.dashway.neo4jwriter.common.exception.InvalidGraphRequestException;
import ai.ssot.dashway.neo4jwriter.graph.contract.GraphDtos;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

public final class CypherSupport {

    private static final Pattern IDENTIFIER_PATTERN = Pattern.compile("^[A-Za-z][A-Za-z0-9_]*$");

    private CypherSupport() {
    }

    public static String validateIdentifier(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new InvalidGraphRequestException(fieldName + " is required.");
        }
        if (!IDENTIFIER_PATTERN.matcher(value).matches()) {
            throw new InvalidGraphRequestException(
                fieldName + " must match ^[A-Za-z][A-Za-z0-9_]*$."
            );
        }
        return value;
    }

    public static String quoteIdentifier(String identifier) {
        return "`" + identifier + "`";
    }

    public static Object normalizePropertyValue(Object value, String fieldName) {
        if (value == null) {
            throw new InvalidGraphRequestException(fieldName + " cannot be null.");
        }

        if (value instanceof String || value instanceof Number || value instanceof Boolean) {
            return value;
        }

        if (value instanceof List<?> list) {
            ValueCategory category = null;
            List<Object> normalized = new ArrayList<>(list.size());
            for (int index = 0; index < list.size(); index++) {
                Object item = list.get(index);
                ValueCategory itemCategory = categoryOf(item, fieldName + "[" + index + "]");
                if (category != null && category != itemCategory) {
                    throw new InvalidGraphRequestException(
                        fieldName + " must contain only one scalar type per array."
                    );
                }
                category = itemCategory;
                normalized.add(item);
            }
            return List.copyOf(normalized);
        }

        throw new InvalidGraphRequestException(
            fieldName + " must be a scalar or scalar array. Nested objects are not supported by Neo4j properties."
        );
    }

    public static LinkedHashMap<String, Object> normalizePropertyMap(
        Map<String, Object> source,
        String fieldName,
        boolean allowEmpty
    ) {
        LinkedHashMap<String, Object> normalized = new LinkedHashMap<>();
        if (source == null) {
            if (allowEmpty) {
                return normalized;
            }
            throw new InvalidGraphRequestException(fieldName + " is required.");
        }

        for (Map.Entry<String, Object> entry : source.entrySet()) {
            String key = validateIdentifier(entry.getKey(), fieldName + " key");
            normalized.put(key, normalizePropertyValue(entry.getValue(), fieldName + "." + key));
        }

        if (!allowEmpty && normalized.isEmpty()) {
            throw new InvalidGraphRequestException(fieldName + " must not be empty.");
        }

        return normalized;
    }

    public static MatchTarget normalizeMatchTarget(GraphDtos.NodeMatchRequest request, String fieldName) {
        if (request == null) {
            throw new InvalidGraphRequestException(fieldName + " is required.");
        }

        String label = validateIdentifier(request.label(), fieldName + ".label");
        LinkedHashMap<String, Object> match = normalizePropertyMap(request.match(), fieldName + ".match", false);
        return new MatchTarget(label, match);
    }

    public static QueryFragment buildMatchClause(String alias, MatchTarget target, String prefix) {
        List<String> predicates = new ArrayList<>();
        LinkedHashMap<String, Object> parameters = new LinkedHashMap<>();

        for (Map.Entry<String, Object> entry : target.match().entrySet()) {
            String paramName = prefix + "_" + entry.getKey();
            predicates.add(alias + "." + quoteIdentifier(entry.getKey()) + " = $" + paramName);
            parameters.put(paramName, entry.getValue());
        }

        String cypher = "MATCH (" + alias + ":" + quoteIdentifier(target.label()) + ") WHERE " + String.join(" AND ", predicates);
        return new QueryFragment(cypher, parameters);
    }

    private static ValueCategory categoryOf(Object value, String fieldName) {
        if (value == null) {
            throw new InvalidGraphRequestException(fieldName + " cannot be null.");
        }
        if (value instanceof String) {
            return ValueCategory.STRING;
        }
        if (value instanceof Number) {
            return ValueCategory.NUMBER;
        }
        if (value instanceof Boolean) {
            return ValueCategory.BOOLEAN;
        }
        throw new InvalidGraphRequestException(
            fieldName + " must be a scalar or scalar array. Nested objects are not supported by Neo4j properties."
        );
    }

    private enum ValueCategory {
        STRING,
        NUMBER,
        BOOLEAN,
    }

    public record MatchTarget(String label, Map<String, Object> match) {
    }

    public record QueryFragment(String cypher, Map<String, Object> parameters) {
    }
}
