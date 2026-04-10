package ai.ssot.contextapi.infrastructure.elasticsearch

import ai.ssot.contextapi.domain.search.dto.AppContentSearchInput
import ai.ssot.contextapi.domain.search.dto.AppContentSearchError
import ai.ssot.contextapi.domain.search.dto.AppContent
import ai.ssot.contextapi.domain.search.dto.AppContentSearchResult
import co.elastic.clients.elasticsearch._types.SortOrder
import ai.ssot.contextapi.generated.types.SourceErrorCode
import ai.ssot.contextapi.generated.types.SourceType
import co.elastic.clients.elasticsearch._types.query_dsl.Operator
import org.springframework.data.elasticsearch.client.elc.NativeQuery
import org.springframework.data.elasticsearch.core.ElasticsearchOperations
import org.springframework.data.elasticsearch.core.SearchHit
import org.springframework.data.elasticsearch.core.search
import org.springframework.stereotype.Component
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import java.net.SocketTimeoutException
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.util.concurrent.TimeoutException

@Component
open class ElasticsearchAppContentRepository(
    private val elasticsearchOperations: ElasticsearchOperations,
    private val objectMapper: ObjectMapper,
) {
    open fun search(input: AppContentSearchInput): AppContentSearchResult {
        val query = buildQuery(input)
        return runCatching {
            val searchHits = elasticsearchOperations.search<AppContentDocument>(query)
            val errors = mutableListOf<AppContentSearchError>()
            val items = searchHits.searchHits.mapNotNull { mapHit(it, errors) }
            AppContentSearchResult(
                totalCount = searchHits.totalHits.toInt(),
                items = items,
                errors = errors,
            )
        }.getOrElse { error ->
            AppContentSearchResult(
                totalCount = 0,
                errors = listOf(
                    AppContentSearchError(
                        code = sourceErrorCode(error),
                        message = error.message ?: "App search failed.",
                    ),
                ),
            )
        }
    }

    private fun buildQuery(request: AppContentSearchInput): NativeQuery =
        NativeQuery.builder()
            .withPageable(request.pageable)
            .withTrackTotalHits(true)
            .withSort { sort ->
                sort.field { field ->
                    field
                        .field(CREATED_DATETIME_FIELD)
                        .order(SortOrder.Desc)
                }
            }
            .withQuery { root ->
                root.bool { bool ->
                    bool.must { must ->
                        must.multiMatch { multiMatch ->
                            multiMatch
                                .query(request.query)
                                .fields(SEARCH_FIELDS)
                                .operator(Operator.And)
                        }
                    }
                    bool.filter { filter ->
                        filter.term { term ->
                            term
                                .field(SOURCE_TYPE_FIELD)
                                .value(SourceType.APP.name)
                        }
                    }
                    bool
                }
            }
            .build()

    private fun mapHit(
        searchHit: SearchHit<AppContentDocument>,
        errors: MutableList<AppContentSearchError>,
    ): AppContent? {
        val document = searchHit.content
        if (document.source != SourceType.APP) {
            errors += invalidResponse("App content document must have source APP.")
            return null
        }
        val rawPayload = parseRawPayload(document.rawPayload).getOrElse {
            errors += invalidResponse("App content rawPayload must be valid JSON.")
            return null
        }
        val createdDatetime = parseCreatedDatetime(document.createdDatetime).getOrElse {
            errors += invalidResponse("App content createdDatetime must be parseable.")
            return null
        }

        return AppContent(
            sourceId = document.sourceId,
            title = document.title,
            content = document.content,
            createdDatetime = createdDatetime,
            rawPayload = rawPayload,
        )
    }

    private fun invalidResponse(
        message: String,
    ): AppContentSearchError =
        AppContentSearchError(
            code = SourceErrorCode.INVALID_RESPONSE,
            message = message,
        )

    private fun parseRawPayload(rawPayload: String): Result<JsonNode> =
        runCatching { objectMapper.readTree(rawPayload) }

    private fun parseCreatedDatetime(createdDatetime: String): Result<LocalDateTime> =
        runCatching { LocalDateTime.parse(createdDatetime) }
            .recoverCatching { OffsetDateTime.parse(createdDatetime).toLocalDateTime() }

    private fun sourceErrorCode(error: Throwable): SourceErrorCode =
        when {
            error.hasCause<SocketTimeoutException>() || error.hasCause<TimeoutException>() -> SourceErrorCode.TIMEOUT
            error.message?.contains("timeout", ignoreCase = true) == true -> SourceErrorCode.TIMEOUT
            else -> SourceErrorCode.UNAVAILABLE
        }

    private inline fun <reified T : Throwable> Throwable.hasCause(): Boolean {
        var current: Throwable? = this
        while (current != null) {
            if (current is T) {
                return true
            }
            current = current.cause
        }
        return false
    }

    companion object {
        private const val SOURCE_TYPE_FIELD = "source_type"
        private const val CREATED_DATETIME_FIELD = "created_datetime"
        private val SEARCH_FIELDS = listOf("title^5", "content")
    }
}
