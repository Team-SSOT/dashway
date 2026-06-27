package ai.ssot.issuetracker.config.graphql

import com.netflix.graphql.dgs.DgsScalar
import graphql.language.StringValue
import graphql.schema.Coercing
import graphql.schema.CoercingParseLiteralException
import graphql.schema.CoercingParseValueException
import graphql.schema.CoercingSerializeException
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException

@DgsScalar(name = "DateTime")
class DateTimeScalar : Coercing<OffsetDateTime, String> {
    override fun serialize(dataFetcherResult: Any): String =
        when (dataFetcherResult) {
            is OffsetDateTime -> dataFetcherResult.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME)
            else -> throw CoercingSerializeException("Expected an OffsetDateTime value.")
        }

    override fun parseValue(input: Any): OffsetDateTime =
        when (input) {
            is String -> parseDateTime(input)
            else -> throw CoercingParseValueException("Expected an ISO-8601 date-time string.")
        }

    override fun parseLiteral(input: Any): OffsetDateTime =
        when (input) {
            is StringValue -> input.value?.let(::parseDateTime)
                ?: throw CoercingParseLiteralException("DateTime literal cannot be null.")
            else -> throw CoercingParseLiteralException("Expected an ISO-8601 date-time string literal.")
        }

    private fun parseDateTime(rawValue: String): OffsetDateTime =
        try {
            OffsetDateTime.parse(rawValue, DateTimeFormatter.ISO_OFFSET_DATE_TIME)
        } catch (_: DateTimeParseException) {
            throw CoercingParseValueException("Expected an ISO-8601 offset date-time string.")
        }
}
