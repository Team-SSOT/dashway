package ai.ssot.contextapi.infrastructure.elasticsearch

import ai.ssot.contextapi.ElasticsearchIntegrationTestEnvironment
import ai.ssot.contextapi.IntegrationTestEnvironment
import ai.ssot.contextapi.TEST_AUTOCONFIG_EXCLUDES
import ai.ssot.contextapi.resetElasticsearchState
import ai.ssot.contextapi.domain.search.dto.AppContentSearchInput
import ai.ssot.contextapi.generated.types.SourceErrorCode
import ai.ssot.contextapi.generated.types.SourceType
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.domain.PageRequest
import org.springframework.data.elasticsearch.client.elc.NativeQuery
import org.springframework.data.elasticsearch.core.ElasticsearchOperations
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@SpringBootTest(properties = [TEST_AUTOCONFIG_EXCLUDES])
class ElasticsearchAppContentRepositoryTests {
    @Autowired
    private lateinit var elasticsearchOperations: ElasticsearchOperations

    @Autowired
    private lateinit var repository: ElasticsearchAppContentRepository

    @BeforeEach
    fun resetIndex() {
        resetElasticsearchState(elasticsearchOperations)
    }

    @Test
    fun `repository builds app_content query and maps hits`() {
        saveDocument(
            AppContentDocument(
                id = "doc-1",
                source = SourceType.APP,
                sourceId = "app-1",
                title = "Docs handbook",
                content = "Docs guide",
                rawPayload = """{"title":"Docs handbook"}""",
                createdDatetime = "2026-04-10T10:00:00",
            ),
        )

        val result = repository.search(
            AppContentSearchInput(
                query = "docs",
                appIds = null,
                pageable = PageRequest.of(0, 20),
            ),
        )

        val query = currentQuery()
        val boolQuery = requireNotNull(query.query).bool()

        assertEquals(1, boolQuery.must().size)
        assertTrue(boolQuery.must()[0].isMultiMatch)
        assertEquals("docs", boolQuery.must()[0].multiMatch().query())
        assertEquals(listOf("title^5", "content"), boolQuery.must()[0].multiMatch().fields())
        assertEquals(1, boolQuery.filter().size)
        assertEquals("source_type", boolQuery.filter()[0].term().field())
        assertEquals("APP", boolQuery.filter()[0].term().value().stringValue())
        assertEquals(1, query.sortOptions.size)
        assertEquals("created_datetime", query.sortOptions[0].field().field())
        assertEquals(1, result.totalCount)
        assertEquals(1, result.items.size)
        assertEquals("app-1", result.items[0].sourceId)
        assertEquals("Docs handbook", result.items[0].title)
        assertEquals("Docs guide", result.items[0].content)
        assertEquals("Docs handbook", result.items[0].rawPayload["title"].asText())
        assertTrue(result.errors.isEmpty())
    }

    @Test
    fun `repository maps malformed raw payloads to invalid response`() {
        saveDocument(
            AppContentDocument(
                id = "doc-1",
                source = SourceType.APP,
                sourceId = "app-1",
                title = "Docs handbook",
                content = "Docs guide",
                rawPayload = "not-json",
                createdDatetime = "2026-04-10T10:00:00",
            ),
        )

        val result = repository.search(
            AppContentSearchInput(
                query = "docs",
                appIds = null,
                pageable = PageRequest.of(0, 20),
            ),
        )

        assertTrue(result.items.isEmpty())
        assertEquals(1, result.errors.size)
        assertEquals(SourceErrorCode.INVALID_RESPONSE, result.errors[0].code)
        assertEquals("App content rawPayload must be valid JSON.", result.errors[0].message)
    }

    @Test
    fun `repository maps invalid created datetime to invalid response`() {
        saveDocument(
            AppContentDocument(
                id = "doc-1",
                source = SourceType.APP,
                sourceId = "app-1",
                title = "Docs handbook",
                content = "Docs guide",
                rawPayload = """{"title":"Docs handbook"}""",
                createdDatetime = "not-a-datetime",
            ),
        )

        val result = repository.search(
            AppContentSearchInput(
                query = "docs",
                appIds = null,
                pageable = PageRequest.of(0, 20),
            ),
        )

        assertTrue(result.items.isEmpty())
        assertEquals(1, result.errors.size)
        assertEquals(SourceErrorCode.INVALID_RESPONSE, result.errors[0].code)
        assertEquals("App content createdDatetime must be parseable.", result.errors[0].message)
    }

    @Test
    fun `repository returns newest app contents first`() {
        saveDocument(
            AppContentDocument(
                id = "doc-older",
                source = SourceType.APP,
                sourceId = "app-1",
                title = "Older docs",
                content = "Older guide",
                rawPayload = """{"title":"Older docs"}""",
                createdDatetime = "2026-04-10T09:00:00",
            ),
        )
        saveDocument(
            AppContentDocument(
                id = "doc-newer",
                source = SourceType.APP,
                sourceId = "app-1",
                title = "Newer docs",
                content = "Newer guide",
                rawPayload = """{"title":"Newer docs"}""",
                createdDatetime = "2026-04-10T10:00:00",
            ),
        )

        val result = repository.search(
            AppContentSearchInput(
                query = "docs",
                appIds = null,
                pageable = PageRequest.of(0, 20),
            ),
        )

        assertEquals(listOf("Newer docs", "Older docs"), result.items.map { it.title })
    }

    private fun saveDocument(document: AppContentDocument) {
        elasticsearchOperations.save(document)
        elasticsearchOperations.indexOps(AppContentDocument::class.java).refresh()
    }

    private fun currentQuery(): NativeQuery =
        repository.javaClass
            .getDeclaredMethod("buildQuery", AppContentSearchInput::class.java)
            .apply { isAccessible = true }
            .invoke(
                repository,
                AppContentSearchInput(
                    query = "docs",
                    appIds = null,
                    pageable = PageRequest.of(0, 20),
                ),
            ) as NativeQuery

    companion object {
        @JvmStatic
        @DynamicPropertySource
        fun registerElasticsearchProperties(registry: DynamicPropertyRegistry) {
            IntegrationTestEnvironment.registerApplicationProperties(registry)
            ElasticsearchIntegrationTestEnvironment.registerProperties(registry)
        }
    }
}
