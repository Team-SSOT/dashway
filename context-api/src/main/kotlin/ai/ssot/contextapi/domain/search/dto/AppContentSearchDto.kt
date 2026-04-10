package ai.ssot.contextapi.domain.search.dto

import ai.ssot.contextapi.generated.types.SourceErrorCode
import org.springframework.data.domain.Pageable
import java.time.LocalDateTime
import tools.jackson.databind.JsonNode

data class AppContentSearchInput(
    val query: String,
    val appIds: List<String>?,
    val pageable: Pageable,
)

data class AppContent(
    val sourceId: String,
    val title: String,
    val content: String,
    val createdDatetime: LocalDateTime,
    val rawPayload: JsonNode,
)

data class AppContentSearchError(
    val code: SourceErrorCode,
    val message: String,
)

data class AppContentSearchResult(
    val totalCount: Int,
    val items: List<AppContent> = emptyList(),
    val errors: List<AppContentSearchError> = emptyList(),
)
