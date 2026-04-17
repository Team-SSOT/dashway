package ai.ssot.contextapi.infrastructure.search

import ai.ssot.contextapi.config.MeilisearchSearchProperties
import ai.ssot.contextapi.domain.search.dto.AppContent
import ai.ssot.contextapi.domain.search.dto.AppContentSearchError
import ai.ssot.contextapi.domain.search.dto.AppContentSearchInput
import ai.ssot.contextapi.domain.search.dto.AppContentSearchResult
import ai.ssot.contextapi.generated.types.SourceErrorCode
import ai.ssot.contextapi.generated.types.SourceType
import com.meilisearch.sdk.Client
import com.meilisearch.sdk.SearchRequest
import com.meilisearch.sdk.model.MatchingStrategy
import org.springframework.stereotype.Component
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper
import java.net.SocketTimeoutException
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.util.concurrent.TimeoutException

@Component
class MeilisearchRepository(
    private val meilisearchClient: Client,
    private val meilisearchProperties: MeilisearchSearchProperties,
    private val objectMapper: ObjectMapper,
) {
    fun search(input: AppContentSearchInput): AppContentSearchResult =
        runCatching {
            val response = meilisearchClient
                .index(meilisearchProperties.indexName)
                .search(buildSearchRequest(input))
            mapSearchResponse(response)
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

    private fun buildSearchRequest(input: AppContentSearchInput): SearchRequest =
        SearchRequest(input.query)
            .setPage(input.pageable.pageNumber + 1)
            .setHitsPerPage(input.pageable.pageSize)
            .setMatchingStrategy(MatchingStrategy.ALL)
            .setSort(arrayOf("${AppContentDocument.CREATED_DATETIME_FIELD}:desc"))
            .setFilterArray(buildFilterArray(input))

    private fun buildFilterArray(input: AppContentSearchInput): Array<Array<String>> =
        buildList {
            buildAppIdFilter(input)?.let(::add)
            add(buildPermissionFilter(input))
        }.toTypedArray()

    private fun buildAppIdFilter(input: AppContentSearchInput): Array<String>? =
        input.appIds
            ?.distinct()
            ?.takeIf { it.isNotEmpty() }
            ?.let { appIds ->
                val escapedIds = appIds.joinToString(", ") { "\"${it.escapeFilterValue()}\"" }
                arrayOf("${AppContentDocument.SOURCE_ID_FIELD} IN [$escapedIds]")
            }

    private fun buildPermissionFilter(input: AppContentSearchInput): Array<String> {
        val permissions = mutableListOf(
            "${AppContentDocument.MEMBER_IDS_FIELD} IS EMPTY AND ${AppContentDocument.TEAM_IDS_FIELD} IS EMPTY",
            "${AppContentDocument.MEMBER_IDS_FIELD} = ${input.memberId}",
        )
        input.teamIds
            ?.distinct()
            ?.takeIf { it.isNotEmpty() }
            ?.let { teamIds ->
                permissions += "${AppContentDocument.TEAM_IDS_FIELD} IN [${teamIds.joinToString(", ")}]"
            }

        return permissions.toTypedArray()
    }

    private fun mapSearchResponse(response: Any): AppContentSearchResult {
        val responseNode = objectMapper.valueToTree<JsonNode>(response)
        val hits = responseNode.path("hits")
        if (!hits.isArray) {
            return AppContentSearchResult(
                totalCount = 0,
                errors = listOf(invalidResponse("App search response hits must be an array.")),
            )
        }

        val errors = mutableListOf<AppContentSearchError>()
        val items = hits.mapNotNull { hit -> mapHit(hit, errors) }
        val totalCount = responseNode.path("totalHits").asInt(responseNode.path("estimatedTotalHits").asInt(0))

        return AppContentSearchResult(
            totalCount = totalCount,
            items = items,
            errors = errors,
        )
    }

    private fun mapHit(
        hit: JsonNode,
        errors: MutableList<AppContentSearchError>,
    ): AppContent? {
        val document = runCatching { objectMapper.treeToValue(hit, AppContentDocument::class.java) }.getOrElse {
            errors += invalidResponse("App content document must match the expected schema.")
            return null
        }
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

    private fun parseRawPayload(rawPayload: String): Result<JsonNode> =
        runCatching { objectMapper.readTree(rawPayload) }

    private fun parseCreatedDatetime(createdDatetime: String): Result<LocalDateTime> =
        runCatching { LocalDateTime.parse(createdDatetime) }
            .recoverCatching { OffsetDateTime.parse(createdDatetime).toLocalDateTime() }

    private fun invalidResponse(message: String): AppContentSearchError =
        AppContentSearchError(
            code = SourceErrorCode.INVALID_RESPONSE,
            message = message,
        )

    private fun sourceErrorCode(error: Throwable): SourceErrorCode =
        when {
            error is IllegalStateException -> SourceErrorCode.INVALID_RESPONSE
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

    private fun String.escapeFilterValue(): String =
        replace("\\", "\\\\").replace("\"", "\\\"")
}
