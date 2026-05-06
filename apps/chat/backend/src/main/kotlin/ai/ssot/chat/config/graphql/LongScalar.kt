package ai.ssot.chat.config.graphql

import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsScalar
import graphql.language.IntValue
import graphql.schema.Coercing
import graphql.schema.CoercingParseLiteralException
import graphql.schema.CoercingParseValueException
import graphql.schema.CoercingSerializeException

@DgsComponent
@DgsScalar(name = "Long")
@Suppress("OVERRIDE_DEPRECATION")
class LongScalar : Coercing<Long, Long> {
    override fun serialize(dataFetcherResult: Any): Long =
        when (dataFetcherResult) {
            is Long -> dataFetcherResult
            is Number -> dataFetcherResult.toLong()
            else -> throw CoercingSerializeException("Expected a 64-bit signed integer value.")
        }

    override fun parseValue(input: Any): Long =
        when (input) {
            is Long -> input
            is Number -> input.toLong()
            else -> throw CoercingParseValueException("Expected a 64-bit signed integer value.")
        }

    override fun parseLiteral(input: Any): Long =
        when (input) {
            is IntValue -> try {
                input.value.longValueExact()
            } catch (_: ArithmeticException) {
                throw CoercingParseLiteralException("Expected a 64-bit signed integer literal.")
            }
            else -> throw CoercingParseLiteralException("Expected a 64-bit signed integer literal.")
        }
}