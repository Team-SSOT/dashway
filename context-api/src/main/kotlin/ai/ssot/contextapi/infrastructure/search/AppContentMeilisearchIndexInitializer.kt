package ai.ssot.contextapi.infrastructure.search

import com.meilisearch.sdk.Client
import com.meilisearch.sdk.Index
import ai.ssot.contextapi.config.MeilisearchSearchProperties
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.boot.ApplicationArguments
import org.springframework.boot.ApplicationRunner
import org.springframework.stereotype.Component
import tools.jackson.databind.JsonNode
import tools.jackson.databind.ObjectMapper

@Component
class AppContentMeilisearchIndexInitializer(
    private val meilisearchClient: Client,
    private val meilisearchProperties: MeilisearchSearchProperties,
    private val objectMapper: ObjectMapper,
) : ApplicationRunner {
    override fun run(args: ApplicationArguments) {
        runCatching { reconcileIndexSettings() }
            .onFailure { error ->
                logger.warn(error) {
                    "Failed to reconcile Meilisearch settings for index `${meilisearchProperties.indexName}`. " +
                        "Search will continue with the existing index settings."
                }
            }
    }

    private fun reconcileIndexSettings() {
        val index = ensureIndex()
        reconcileSearchableAttributes(index)
        reconcileFilterableAttributes(index)
        reconcileSortableAttributes(index)
    }

    private fun ensureIndex(): Index =
        runCatching { meilisearchClient.getIndex(meilisearchProperties.indexName) }
            .getOrElse {
                logger.info {
                    "Creating Meilisearch index `${meilisearchProperties.indexName}` for app content search."
                }
                meilisearchClient.waitForTask(
                    meilisearchClient.createIndex(
                        meilisearchProperties.indexName,
                        AppContentDocument.PRIMARY_KEY_FIELD,
                    ).taskUid,
                )
                meilisearchClient.index(meilisearchProperties.indexName)
            }

    private fun reconcileSearchableAttributes(index: Index) {
        val expected = AppContentDocument.searchableAttributesSettings()
        val current = index.getSearchableAttributesSettings()
        if (current.contentEquals(expected)) {
            return
        }

        logger.info {
            "Updating searchableAttributes for Meilisearch index `${meilisearchProperties.indexName}`."
        }
        index.waitForTask(index.updateSearchableAttributesSettings(expected).taskUid)
    }

    private fun reconcileFilterableAttributes(index: Index) {
        val expected = AppContentDocument.filterableAttributesSettings()
        val current = index.getGranularFilterableAttributesSettings()
        if (settingsEqual(current, expected)) {
            return
        }

        logger.info {
            "Updating filterableAttributes for Meilisearch index `${meilisearchProperties.indexName}`."
        }
        index.waitForTask(index.updateGranularFilterableAttributesSettings(expected).taskUid)
    }

    private fun reconcileSortableAttributes(index: Index) {
        val expected = AppContentDocument.sortableAttributesSettings()
        val current = index.getSortableAttributesSettings()
        if (current.contentEquals(expected)) {
            return
        }

        logger.info {
            "Updating sortableAttributes for Meilisearch index `${meilisearchProperties.indexName}`."
        }
        index.waitForTask(index.updateSortableAttributesSettings(expected).taskUid)
    }

    private fun settingsEqual(current: Any?, expected: Any?): Boolean =
        objectMapper.valueToTree<JsonNode>(current) == objectMapper.valueToTree<JsonNode>(expected)

    companion object {
        private val logger = KotlinLogging.logger {}
    }
}
