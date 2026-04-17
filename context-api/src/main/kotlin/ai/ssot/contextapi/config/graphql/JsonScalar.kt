package ai.ssot.contextapi.config.graphql

import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsScalar
import graphql.language.ArrayValue
import graphql.language.BooleanValue
import graphql.language.EnumValue
import graphql.language.FloatValue
import graphql.language.IntValue
import graphql.language.NullValue
import graphql.language.ObjectField
import graphql.language.ObjectValue
import graphql.language.StringValue
import graphql.language.Value
import graphql.schema.Coercing
import graphql.schema.CoercingParseLiteralException
import graphql.schema.CoercingParseValueException
import graphql.schema.CoercingSerializeException
import tools.jackson.databind.JsonNode
import tools.jackson.module.kotlin.jacksonObjectMapper

@DgsComponent
@DgsScalar(name = "JSON")
@Suppress("OVERRIDE_DEPRECATION")
class JsonScalar : Coercing<JsonNode, Any?> {
    private val objectMapper = jacksonObjectMapper()

    override fun serialize(dataFetcherResult: Any): Any? =
        try {
            toSerializableValue(
                when (dataFetcherResult) {
                    is JsonNode -> dataFetcherResult
                    else -> objectMapper.valueToTree(dataFetcherResult)
                },
            )
        } catch (_: IllegalArgumentException) {
            throw CoercingSerializeException("Expected a JSON-compatible value.")
        }

    override fun parseValue(input: Any): JsonNode =
        try {
            when (input) {
                is JsonNode -> input
                else -> objectMapper.valueToTree(input)
            }
        } catch (_: IllegalArgumentException) {
            throw CoercingParseValueException("Expected a JSON-compatible value.")
        }

    override fun parseLiteral(input: Any): JsonNode =
        when (input) {
            is Value<*> -> parseLiteralValue(input)
            else -> throw CoercingParseLiteralException("Expected a JSON literal.")
        }

    private fun parseLiteralValue(value: Value<*>): JsonNode =
        when (value) {
            is ObjectValue -> objectMapper.createObjectNode().apply {
                value.objectFields.forEach { field: ObjectField ->
                    set(field.name, parseLiteralValue(field.value))
                }
            }

            is ArrayValue -> objectMapper.createArrayNode().apply {
                value.values.forEach { add(parseLiteralValue(it)) }
            }

            is StringValue -> objectMapper.valueToTree(value.value)
            is IntValue -> objectMapper.valueToTree(value.value)
            is FloatValue -> objectMapper.valueToTree(value.value)
            is BooleanValue -> objectMapper.valueToTree(value.isValue)
            is EnumValue -> objectMapper.valueToTree(value.name)
            is NullValue -> objectMapper.nullNode()
            else -> throw CoercingParseLiteralException("Expected a JSON literal.")
        }

    private fun toSerializableValue(node: JsonNode): Any? =
        when {
            node.isObject -> node.properties().asSequence().associate { it.key to toSerializableValue(it.value) }
            node.isArray -> node.map(::toSerializableValue)
            node.isTextual -> node.textValue()
            node.isIntegralNumber -> node.numberValue()
            node.isFloatingPointNumber -> node.numberValue()
            node.isBoolean -> node.booleanValue()
            node.isNull -> null
            else -> node.toString()
        }
}
