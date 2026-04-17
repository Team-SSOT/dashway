package ai.ssot.contextapi.infrastructure.search

import ai.ssot.contextapi.*
import ai.ssot.contextapi.config.MeilisearchSearchProperties
import ai.ssot.contextapi.domain.search.dto.AppContentSearchInput
import ai.ssot.contextapi.generated.types.SourceErrorCode
import ai.ssot.contextapi.generated.types.SourceType
import com.meilisearch.sdk.Client
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.domain.PageRequest
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@SpringBootTest(properties = [TEST_AUTOCONFIG_EXCLUDES])
class AppContentSearchRepositoryTests {
    @Autowired
    private lateinit var meilisearchClient: Client

    @Autowired
    private lateinit var meilisearchProperties: MeilisearchSearchProperties

    @Autowired
    private lateinit var repository: MeilisearchRepository

    @BeforeEach
    fun resetIndex() {
        resetMeilisearchState(meilisearchClient, meilisearchProperties)
    }

    @Test
    fun `repository searches app content and applies appIds filter`() {
        saveDocuments(
            AppContentDocument(
                id = "doc-1",
                source = SourceType.APP,
                sourceId = "app-1",
                title = "Docs handbook",
                content = "Docs guide",
                rawPayload = """{"title":"Docs handbook"}""",
                createdDatetime = "2026-04-10T10:00:00",
                memberIds = listOf(7),
            ),
            AppContentDocument(
                id = "doc-2",
                source = SourceType.APP,
                sourceId = "app-2",
                title = "Docs roadmap",
                content = "Docs plans",
                rawPayload = """{"title":"Docs roadmap"}""",
                createdDatetime = "2026-04-10T09:00:00",
                memberIds = listOf(7),
            ),
        )

        val result = repository.search(
            AppContentSearchInput(
                query = "docs",
                appIds = listOf("app-1"),
                memberId = 7,
                teamIds = emptyList(),
                pageable = PageRequest.of(0, 20),
            ),
        )

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
        saveDocuments(
            AppContentDocument(
                id = "doc-1",
                source = SourceType.APP,
                sourceId = "app-1",
                title = "Docs handbook",
                content = "Docs guide",
                rawPayload = "not-json",
                createdDatetime = "2026-04-10T10:00:00",
                memberIds = listOf(7),
            ),
        )

        val result = repository.search(
            AppContentSearchInput(
                query = "docs",
                appIds = null,
                memberId = 7,
                teamIds = emptyList(),
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
        saveDocuments(
            AppContentDocument(
                id = "doc-1",
                source = SourceType.APP,
                sourceId = "app-1",
                title = "Docs handbook",
                content = "Docs guide",
                rawPayload = """{"title":"Docs handbook"}""",
                createdDatetime = "not-a-datetime",
                memberIds = listOf(7),
            ),
        )

        val result = repository.search(
            AppContentSearchInput(
                query = "docs",
                appIds = null,
                memberId = 7,
                teamIds = emptyList(),
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
        saveDocuments(
            AppContentDocument(
                id = "doc-older",
                source = SourceType.APP,
                sourceId = "app-1",
                title = "Older docs",
                content = "Older guide",
                rawPayload = """{"title":"Older docs"}""",
                createdDatetime = "2026-04-10T09:00:00",
                memberIds = listOf(7),
            ),
            AppContentDocument(
                id = "doc-newer",
                source = SourceType.APP,
                sourceId = "app-1",
                title = "Newer docs",
                content = "Newer guide",
                rawPayload = """{"title":"Newer docs"}""",
                createdDatetime = "2026-04-10T10:00:00",
                memberIds = listOf(7),
            ),
        )

        val result = repository.search(
            AppContentSearchInput(
                query = "docs",
                appIds = null,
                memberId = 7,
                teamIds = emptyList(),
                pageable = PageRequest.of(0, 20),
            ),
        )

        assertEquals(listOf("Newer docs", "Older docs"), result.items.map { it.title })
    }

    @Test
    fun `repository applies member, team, and empty permission rules under current policy`() {
        saveDocuments(
            AppContentDocument(
                id = "doc-member",
                source = SourceType.APP,
                sourceId = "app-member",
                title = "Member docs",
                content = "Visible for member",
                rawPayload = """{"title":"Member docs"}""",
                createdDatetime = "2026-04-10T10:00:00",
                memberIds = listOf(7),
            ),
            AppContentDocument(
                id = "doc-team",
                source = SourceType.APP,
                sourceId = "app-team",
                title = "Team docs",
                content = "Visible for team",
                rawPayload = """{"title":"Team docs"}""",
                createdDatetime = "2026-04-10T09:00:00",
                teamIds = listOf(101),
            ),
            AppContentDocument(
                id = "doc-public",
                source = SourceType.APP,
                sourceId = "app-public",
                title = "Public docs",
                content = "Visible for everyone",
                rawPayload = """{"title":"Public docs"}""",
                createdDatetime = "2026-04-10T08:00:00",
                memberIds = listOf(0),
            ),
            AppContentDocument(
                id = "doc-empty",
                source = SourceType.APP,
                sourceId = "app-empty",
                title = "Unrestricted docs",
                content = "Visible without permission filters",
                rawPayload = """{"title":"Unrestricted docs"}""",
                createdDatetime = "2026-04-10T07:00:00",
            ),
            AppContentDocument(
                id = "doc-blocked",
                source = SourceType.APP,
                sourceId = "app-blocked",
                title = "Blocked docs",
                content = "Should stay hidden",
                rawPayload = """{"title":"Blocked docs"}""",
                createdDatetime = "2026-04-10T06:00:00",
                memberIds = listOf(999),
                teamIds = listOf(555),
            ),
        )

        val result = repository.search(
            AppContentSearchInput(
                query = "docs",
                appIds = null,
                memberId = 7,
                teamIds = listOf(101),
                pageable = PageRequest.of(0, 20),
            ),
        )

        assertEquals(
            listOf("Member docs", "Team docs", "Unrestricted docs"),
            result.items.map { it.title },
        )
        assertTrue(result.errors.isEmpty())
    }

    private fun saveDocuments(vararg documents: AppContentDocument) {
        indexAppContentDocuments(
            client = meilisearchClient,
            properties = meilisearchProperties,
            documents = documents.toList(),
        )
    }

    companion object {
        @JvmStatic
        @DynamicPropertySource
        fun registerMeilisearchProperties(registry: DynamicPropertyRegistry) {
            IntegrationTestEnvironment.registerApplicationProperties(registry)
            MeilisearchIntegrationTestEnvironment.registerProperties(registry)
        }
    }
}
