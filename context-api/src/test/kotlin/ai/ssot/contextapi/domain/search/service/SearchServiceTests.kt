package ai.ssot.contextapi.domain.search.service

import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.domain.member.service.MemberService
import ai.ssot.contextapi.domain.search.dto.AppContent
import ai.ssot.contextapi.domain.search.dto.AppContentSearchError
import ai.ssot.contextapi.domain.search.dto.AppContentSearchInput
import ai.ssot.contextapi.domain.search.dto.AppContentSearchResult
import ai.ssot.contextapi.domain.search.dto.SearchInput
import ai.ssot.contextapi.domain.team.entity.Team
import ai.ssot.contextapi.domain.team.service.TeamService
import ai.ssot.contextapi.generated.types.SourceErrorCode
import ai.ssot.contextapi.generated.types.SourceType
import ai.ssot.contextapi.infrastructure.elasticsearch.ElasticsearchAppContentRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.mockito.Mockito.inOrder
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.Mockito.`when`
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import tools.jackson.module.kotlin.jacksonObjectMapper
import java.time.LocalDateTime

class SearchServiceTests {
    private val memberService = mock(MemberService::class.java)
    private val teamService = mock(TeamService::class.java)
    private val appContentSearchService = mock(ElasticsearchAppContentRepository::class.java)
    private val searchService = SearchService(
        memberService = memberService,
        teamService = teamService,
        appContentSearchService = appContentSearchService,
    )
    private val objectMapper = jacksonObjectMapper()

    @Test
    fun `search calls all default sources and aggregates results`() {
        val pageable = PageRequest.of(0, 20)
        `when`(memberService.search("alice", pageable)).thenReturn(
            PageImpl(
                listOf(
                    Member(
                        id = 10L,
                        name = "Alice Johnson",
                        email = "alice@example.com",
                        password = "pw",
                        isEnabled = true,
                        createdDatetime = LocalDateTime.parse("2026-04-10T10:00:00"),
                    ),
                ),
                pageable,
                1,
            ),
        )
        `when`(teamService.search("alice", pageable)).thenReturn(
            PageImpl(
                listOf(
                    Team(
                        id = 20L,
                        name = "Alice Platform",
                        createdDatetime = LocalDateTime.parse("2026-04-10T09:00:00"),
                    ),
                ),
                pageable,
                1,
            ),
        )
        `when`(appContentSearchService.search(AppContentSearchInput("alice", null, pageable))).thenReturn(
            AppContentSearchResult(
                totalCount = 1,
                items = listOf(
                    AppContent(
                        sourceId = "app-1",
                        title = "Alice handbook",
                        content = "Alice onboarding guide",
                        createdDatetime = LocalDateTime.parse("2026-04-10T09:30:00"),
                        rawPayload = objectMapper.readTree("""{"title":"Alice handbook"}"""),
                    ),
                ),
            ),
        )

        val result = searchService.search(
            memberId = 99L,
            input = SearchInput(query = "alice"),
        )

        val inOrder = inOrder(memberService, teamService, appContentSearchService)
        inOrder.verify(memberService).search("alice", pageable)
        inOrder.verify(teamService).search("alice", pageable)
        inOrder.verify(appContentSearchService).search(AppContentSearchInput("alice", null, pageable))

        assertEquals(3, result.items.size)
        assertEquals("SearchMemberItem", result.items[0]::class.java.simpleName)
        assertEquals("SearchTeamItem", result.items[1]::class.java.simpleName)
        assertEquals("SearchAppContentItem", result.items[2]::class.java.simpleName)
        assertEquals(0, result.pageInfo.page)
        assertEquals(20, result.pageInfo.size)
        assertEquals(3, result.pageInfo.totalElements)
        assertEquals(0, result.pageInfo.totalPages)
        assertTrue(result.sourceErrors.isEmpty())
    }

    @Test
    fun `search only calls requested sources`() {
        val pageable = PageRequest.of(0, 20)
        `when`(appContentSearchService.search(AppContentSearchInput("docs", null, pageable))).thenReturn(
            AppContentSearchResult(totalCount = 0),
        )

        val result = searchService.search(
            memberId = 1L,
            input = SearchInput(
                query = "docs",
                sources = listOf(SourceType.APP),
            ),
        )

        verifyNoInteractions(memberService, teamService)
        verify(appContentSearchService).search(AppContentSearchInput("docs", null, pageable))
        assertTrue(result.items.isEmpty())
        assertTrue(result.sourceErrors.isEmpty())
    }

    @Test
    fun `search forwards appIds to app content search`() {
        val pageable = PageRequest.of(0, 20)
        val expectedRequest = AppContentSearchInput(
            query = "docs",
            appIds = listOf("app-1", "app-2"),
            pageable = pageable,
        )
        `when`(appContentSearchService.search(expectedRequest)).thenReturn(
            AppContentSearchResult(totalCount = 0),
        )

        searchService.search(
            memberId = 1L,
            input = SearchInput(
                query = "docs",
                sources = listOf(SourceType.APP),
                appIds = listOf("app-1", "app-2"),
            ),
        )

        verify(appContentSearchService).search(expectedRequest)
    }

    @Test
    fun `search converts member and team failures to unknown source errors`() {
        val pageable = PageRequest.of(0, 20)
        `when`(memberService.search("alice", pageable)).thenThrow(IllegalStateException("member boom"))
        `when`(teamService.search("alice", pageable)).thenThrow(IllegalArgumentException("team boom"))

        val result = searchService.search(
            memberId = 1L,
            input = SearchInput(
                query = "alice",
                sources = listOf(SourceType.MEMBER, SourceType.TEAM),
            ),
        )

        assertTrue(result.items.isEmpty())
        assertEquals(2, result.sourceErrors.size)
        assertEquals(SourceType.MEMBER, result.sourceErrors[0].sourceType)
        assertEquals(SourceErrorCode.UNKNOWN, result.sourceErrors[0].code)
        assertEquals("member boom", result.sourceErrors[0].message)
        assertEquals(SourceType.TEAM, result.sourceErrors[1].sourceType)
        assertEquals(SourceErrorCode.UNKNOWN, result.sourceErrors[1].code)
        assertEquals("team boom", result.sourceErrors[1].message)
    }

    @Test
    fun `search keeps app items and app source errors together`() {
        val pageable = PageRequest.of(0, 20)
        `when`(appContentSearchService.search(AppContentSearchInput("docs", null, pageable))).thenReturn(
            AppContentSearchResult(
                totalCount = 1,
                items = listOf(
                    AppContent(
                        sourceId = "app-1",
                        title = "Docs handbook",
                        content = "Docs guide",
                        createdDatetime = LocalDateTime.parse("2026-04-10T09:30:00"),
                        rawPayload = objectMapper.readTree("""{"title":"Docs handbook"}"""),
                    ),
                ),
                errors = listOf(
                    AppContentSearchError(
                        code = SourceErrorCode.INVALID_RESPONSE,
                        message = "App content rawPayload must be valid JSON.",
                    ),
                ),
            ),
        )

        val result = searchService.search(
            memberId = 5L,
            input = SearchInput(
                query = "docs",
                sources = listOf(SourceType.APP),
            ),
        )

        assertEquals(1, result.items.size)
        assertEquals(SourceType.APP, result.items[0].sources)
        assertEquals(1, result.sourceErrors.size)
        assertEquals(SourceType.APP, result.sourceErrors[0].sourceType)
        assertEquals(SourceErrorCode.INVALID_RESPONSE, result.sourceErrors[0].code)
        assertEquals("App content rawPayload must be valid JSON.", result.sourceErrors[0].message)
    }
}
