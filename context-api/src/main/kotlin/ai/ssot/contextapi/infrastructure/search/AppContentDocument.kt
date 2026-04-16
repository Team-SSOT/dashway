package ai.ssot.contextapi.infrastructure.search

import com.meilisearch.sdk.model.FilterableAttributesConfig
import com.meilisearch.sdk.model.FilterableAttributesFeatures
import com.meilisearch.sdk.model.FilterableAttributesFilter
import ai.ssot.contextapi.generated.types.SourceType

data class AppContentDocument(
    val id: String,
    val sourceId: String,
    val source: SourceType,
    val title: String,
    val content: String,
    val rawPayload: String,
    val createdDatetime: String,
    val memberIds: List<Long> = emptyList(),
    val teamIds: List<Long> = emptyList(),
) {
    companion object {
        const val PRIMARY_KEY_FIELD = "id"
        const val SOURCE_ID_FIELD = "sourceId"
        const val SOURCE_FIELD = "source"
        const val TITLE_FIELD = "title"
        const val CONTENT_FIELD = "content"
        const val MEMBER_IDS_FIELD = "memberIds"
        const val TEAM_IDS_FIELD = "teamIds"

        // Keep index settings beside the indexed document so field changes do not silently drift.
        fun searchableAttributesSettings(): Array<String> =
            arrayOf(TITLE_FIELD, CONTENT_FIELD)

        fun filterableAttributesSettings(): Array<FilterableAttributesConfig> =
            arrayOf(
                FilterableAttributesConfig(
                    arrayOf(SOURCE_FIELD, SOURCE_ID_FIELD, MEMBER_IDS_FIELD, TEAM_IDS_FIELD),
                    FilterableAttributesFeatures(
                        false,
                        FilterableAttributesFilter(
                            true,
                            false,
                        ),
                    ),
                ),
            )
    }
}
