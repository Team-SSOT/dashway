package ai.ssot.contextapi.infrastructure.search

import com.meilisearch.sdk.Client
import ai.ssot.contextapi.IntegrationTestEnvironment
import ai.ssot.contextapi.MeilisearchIntegrationTestEnvironment
import ai.ssot.contextapi.TEST_AUTOCONFIG_EXCLUDES
import ai.ssot.contextapi.config.MeilisearchSearchProperties
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import kotlin.test.assertContentEquals
import kotlin.test.assertEquals
import tools.jackson.module.kotlin.jacksonObjectMapper

@SpringBootTest(properties = [TEST_AUTOCONFIG_EXCLUDES])
class AppContentMeilisearchIndexInitializerTests {
    @Autowired
    private lateinit var meilisearchClient: Client

    @Autowired
    private lateinit var meilisearchProperties: MeilisearchSearchProperties

    @Test
    fun `initializer applies app content index settings on startup`() {
        val index = meilisearchClient.index(meilisearchProperties.indexName)

        assertContentEquals(
            AppContentDocument.searchableAttributesSettings(),
            index.getSearchableAttributesSettings(),
        )
        assertEquals(
            TEST_OBJECT_MAPPER.writeValueAsString(AppContentDocument.filterableAttributesSettings()),
            TEST_OBJECT_MAPPER.writeValueAsString(index.getGranularFilterableAttributesSettings()),
        )
    }

    companion object {
        private val TEST_OBJECT_MAPPER = jacksonObjectMapper()

        @JvmStatic
        @DynamicPropertySource
        fun registerMeilisearchProperties(registry: DynamicPropertyRegistry) {
            IntegrationTestEnvironment.registerApplicationProperties(registry)
            MeilisearchIntegrationTestEnvironment.registerProperties(registry)
            registry.add("context-api.search.meilisearch.index-name") { "app_content_initializer_test" }
        }
    }
}
