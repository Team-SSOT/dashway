package ai.ssot.contextapi

import com.meilisearch.sdk.Client
import com.meilisearch.sdk.exceptions.MeilisearchException
import ai.ssot.contextapi.config.MeilisearchSearchProperties
import ai.ssot.contextapi.infrastructure.search.AppContentDocument
import org.springframework.test.context.DynamicPropertyRegistry
import org.testcontainers.containers.GenericContainer
import org.testcontainers.containers.wait.strategy.Wait
import java.time.Duration
import tools.jackson.module.kotlin.jacksonObjectMapper

internal object MeilisearchIntegrationTestEnvironment {
    private const val MEILISEARCH_PORT = 7700

    private val meilisearch: GenericContainer<Nothing> by lazy {
        GenericContainer<Nothing>("getmeili/meilisearch:v1.15").apply {
            withEnv("MEILI_ENV", "development")
            withEnv("MEILI_NO_ANALYTICS", "true")
            withExposedPorts(MEILISEARCH_PORT)
            waitingFor(
                Wait.forListeningPort()
                    .withStartupTimeout(Duration.ofMinutes(3)),
            )
            start()
        }
    }

    fun registerProperties(registry: DynamicPropertyRegistry) {
        registry.add("context-api.search.meilisearch.host") {
            "http://${meilisearch.host}:${meilisearch.getMappedPort(MEILISEARCH_PORT)}"
        }
        registry.add("context-api.search.meilisearch.api-key") { "" }
        registry.add("context-api.search.meilisearch.index-name") { "app_content" }
    }
}

internal fun resetMeilisearchState(
    client: Client,
    properties: MeilisearchSearchProperties,
) {
    deleteIndexIfExists(client, properties.indexName)
    client.waitForTask(client.createIndex(properties.indexName, AppContentDocument.PRIMARY_KEY_FIELD).taskUid)
    val index = client.index(properties.indexName)
    client.waitForTask(index.updateSearchableAttributesSettings(AppContentDocument.searchableAttributesSettings()).taskUid)
    client.waitForTask(
        index.updateGranularFilterableAttributesSettings(
            AppContentDocument.filterableAttributesSettings(),
        ).taskUid,
    )
}

internal fun indexAppContentDocuments(
    client: Client,
    properties: MeilisearchSearchProperties,
    documents: List<AppContentDocument>,
) {
    if (documents.isEmpty()) {
        return
    }

    client.waitForTask(
        client.index(properties.indexName)
            .addDocuments(MEILISEARCH_OBJECT_MAPPER.writeValueAsString(documents))
            .taskUid,
    )
}

private fun deleteIndexIfExists(
    client: Client,
    indexName: String,
) {
    try {
        client.getIndex(indexName)
        client.waitForTask(client.deleteIndex(indexName).taskUid)
    } catch (_: MeilisearchException) {
        // Index absence is expected during reset.
    }
}

private val MEILISEARCH_OBJECT_MAPPER = jacksonObjectMapper()
