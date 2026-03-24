package ai.ssot.contextapi.config.graphql

import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsScalar
import graphql.language.StringValue
import graphql.schema.Coercing
import graphql.schema.CoercingParseLiteralException
import graphql.schema.CoercingParseValueException
import graphql.schema.CoercingSerializeException
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException

@DgsComponent
@DgsScalar(name = "DateTime")
@Suppress("OVERRIDE_DEPRECATION")
class DateTimeScalar : Coercing<LocalDateTime, String> {
    override fun serialize(dataFetcherResult: Any): String =
        when (dataFetcherResult) {
            is LocalDateTime -> dataFetcherResult.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            else -> throw CoercingSerializeException("Expected a LocalDateTime value.")
        }

    override fun parseValue(input: Any): LocalDateTime =
        when (input) {
            is String -> parseDateTime(input)
            else -> throw CoercingParseValueException("Expected a String value.")
        }

    override fun parseLiteral(input: Any): LocalDateTime =
        when (input) {
            is StringValue -> input.value?.let(::parseDateTime)
                ?: throw CoercingParseLiteralException("Expected a non-null String literal.")
            else -> throw CoercingParseLiteralException("Expected a String literal.")
        }

    private fun parseDateTime(rawValue: String): LocalDateTime =
        try {
            LocalDateTime.parse(rawValue, DateTimeFormatter.ISO_LOCAL_DATE_TIME)
        } catch (_: DateTimeParseException) {
            throw CoercingParseValueException("Expected an ISO-8601 local date-time string.")
        }
}
