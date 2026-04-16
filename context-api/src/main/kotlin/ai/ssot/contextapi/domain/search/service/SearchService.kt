package ai.ssot.contextapi.domain.search.service

import ai.ssot.contextapi.domain.search.dto.SearchInput
import ai.ssot.contextapi.domain.search.dto.SearchItem
import ai.ssot.contextapi.domain.search.dto.SearchForMemberResult
import ai.ssot.contextapi.domain.search.dto.SearchSourceError
import ai.ssot.contextapi.domain.search.dto.SearchAppContentItem
import ai.ssot.contextapi.domain.search.dto.SearchMemberItem
import ai.ssot.contextapi.domain.search.dto.SearchTeamItem
import ai.ssot.contextapi.domain.member.service.MemberService
import ai.ssot.contextapi.domain.search.dto.AppContentSearchInput
import ai.ssot.contextapi.domain.team.service.TeamService
import ai.ssot.contextapi.infrastructure.search.AppContentSearchRepository
import ai.ssot.contextapi.generated.types.SourceErrorCode
import ai.ssot.contextapi.generated.types.SourceType
import ai.ssot.contextapi.shared.page.PageInfo
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class SearchService(
    private val memberService: MemberService,
    private val teamService: TeamService,
    private val appContentSearchService: AppContentSearchRepository,
) {
    @Transactional(readOnly = true)
    fun search(memberId: Long, input: SearchInput): SearchForMemberResult {
        val pageable = PageRequest.of(input.page, input.size)
        val sources = input.sources
            ?.distinct()
            ?.takeIf { it.isNotEmpty() }
            ?: listOf(SourceType.MEMBER, SourceType.TEAM, SourceType.APP)

        val results = sources.map { source ->
            when (source) {
                SourceType.MEMBER -> executeMemberSearch(input.query, pageable)
                SourceType.TEAM -> executeTeamSearch(input.query, pageable)
                SourceType.APP -> executeAppSearch(memberId, input.query, input.appIds, pageable)
            }
        }
        val items = results.flatMap { it.items }
        val totalCount = results.sumOf { it.totalCount }.toLong()

        return SearchForMemberResult(
            items = items,
            pageInfo = PageInfo(
                totalCount = totalCount,
                totalPages = 0,
                pageable = pageable,
            ),
            sourceErrors = results.flatMap { it.sourceErrors },
        )
    }

    private fun executeMemberSearch(
        query: String,
        pageable: Pageable,
    ): SourceExecutionResult =
        runCatching {
            val result = memberService.search(query, pageable)
            SourceExecutionResult(
                totalCount = result.totalElements.toInt(),
                items = result.content.map(SearchMemberItem::from),
            )
        }.getOrElse { error ->
            SourceExecutionResult(
                sourceErrors = listOf(
                    SearchSourceError.of(
                        sourceType = SourceType.MEMBER,
                        code = SourceErrorCode.UNKNOWN,
                        message = error.message ?: "Member search failed.",
                    ),
                ),
            )
        }

    private fun executeTeamSearch(
        query: String,
        pageable: Pageable,
    ): SourceExecutionResult =
        runCatching {
            val result = teamService.search(query, pageable)
            SourceExecutionResult(
                totalCount = result.totalElements.toInt(),
                items = result.content.map(SearchTeamItem::from),
            )
        }.getOrElse { error ->
            SourceExecutionResult(
                sourceErrors = listOf(
                    SearchSourceError.of(
                        sourceType = SourceType.TEAM,
                        code = SourceErrorCode.UNKNOWN,
                        message = error.message ?: "Team search failed.",
                    ),
                ),
            )
        }

    private fun executeAppSearch(
        memberId: Long,
        query: String,
        appIds: List<String>?,
        pageable: Pageable,
    ): SourceExecutionResult =
        runCatching {
            val result = appContentSearchService.search(
                AppContentSearchInput(
                    query = query,
                    appIds = appIds,
                    memberId = memberId,
                    teamIds = teamService.getTeamIdsByMemberId(memberId),
                    pageable = pageable,
                ),
            )
            SourceExecutionResult(
                totalCount = result.totalCount,
                items = result.items.map(SearchAppContentItem::from),
                sourceErrors = result.errors.map {
                    SearchSourceError.of(
                        sourceType = SourceType.APP,
                        code = it.code,
                        message = it.message,
                    )
                },
            )
        }.getOrElse { error ->
            SourceExecutionResult(
                sourceErrors = listOf(
                    SearchSourceError.of(
                        sourceType = SourceType.APP,
                        code = SourceErrorCode.UNKNOWN,
                        message = error.message ?: "App search failed.",
                    ),
                ),
            )
        }

    private data class SourceExecutionResult(
        val totalCount: Int = 0,
        val items: List<SearchItem> = emptyList(),
        val sourceErrors: List<SearchSourceError> = emptyList(),
    )
}
