package ai.ssot.contextapi.domain.search.dto

import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.domain.team.entity.Team
import ai.ssot.contextapi.generated.types.SourceErrorCode
import ai.ssot.contextapi.generated.types.SourceType
import ai.ssot.contextapi.shared.page.PageInfo
import tools.jackson.databind.JsonNode
import java.time.LocalDateTime
import ai.ssot.contextapi.generated.types.AppSearchItem as AppSearchItemGraphql
import ai.ssot.contextapi.generated.types.MemberSearchItem as MemberSearchItemGraphql
import ai.ssot.contextapi.generated.types.SearchInput as SearchInputGraphql
import ai.ssot.contextapi.generated.types.SearchItem as SearchItemGraphql
import ai.ssot.contextapi.generated.types.SearchResult as SearchResultGraphql
import ai.ssot.contextapi.generated.types.SearchSourceError as SearchSourceErrorGraphql
import ai.ssot.contextapi.generated.types.TeamSearchItem as TeamSearchItemGraphql

data class SearchInput(
    val query: String,
    val page: Int = 0,
    val size: Int = 20,
    val sources: List<SourceType>? = null,
    val appIds: List<String>? = null,
) {
    companion object {
        fun from(graphqlInput: SearchInputGraphql): SearchInput =
            SearchInput(
                query = graphqlInput.query,
                page = graphqlInput.page,
                size = graphqlInput.size,
                sources = graphqlInput.sources,
                appIds = graphqlInput.appIds
            )
    }
}

data class SearchForMemberResult(
    val items: List<SearchItem>,
    val pageInfo: PageInfo,
    val sourceErrors: List<SearchSourceError> = emptyList(),
) {
    fun toGraphql(): SearchResultGraphql = SearchResultGraphql.newBuilder()
        .items(items.map { it.toGraphql() })
        .pageInfo(pageInfo)
        .sourceErrors(sourceErrors.map { it.toGraphql() })
        .build()
}

sealed interface SearchItem {
    val sourceId: String
    val sources: SourceType
    val title: String
    val createdDatetime: LocalDateTime

    fun toGraphql(): SearchItemGraphql
}

data class SearchMemberItem(
    override val sources: SourceType,
    override val sourceId: String,
    override val title: String,
    override val createdDatetime: LocalDateTime,
    val name: String,
    val email: String,
) : SearchItem {
    override fun toGraphql(): SearchItemGraphql = MemberSearchItemGraphql.newBuilder()
        .sources(sources)
        .sourceId(sourceId)
        .title(title)
        .name(name)
        .email(email)
        .createdDatetime(createdDatetime)
        .build()

    companion object {
        fun from(member: Member): SearchMemberItem =
            SearchMemberItem(
                sources = SourceType.MEMBER,
                sourceId = member.id!!.toString(),
                title = member.name,
                createdDatetime = member.createdDatetime,
                name = member.name,
                email = member.email,
            )
    }
}

data class SearchTeamItem(
    override val sources: SourceType,
    override val sourceId: String,
    override val title: String,
    override val createdDatetime: LocalDateTime,
    val name: String,
) : SearchItem {
    override fun toGraphql(): SearchItemGraphql = TeamSearchItemGraphql.newBuilder()
        .sources(sources)
        .sourceId(sourceId)
        .title(title)
        .name(name)
        .createdDatetime(createdDatetime)
        .build()

    companion object {
        fun from(team: Team): SearchTeamItem =
            SearchTeamItem(
                sources = SourceType.TEAM,
                sourceId = team.id!!.toString(),
                title = team.name,
                createdDatetime = team.createdDatetime,
                name = team.name,
            )
    }
}

data class SearchAppContentItem(
    override val sources: SourceType,
    override val sourceId: String,
    override val title: String,
    override val createdDatetime: LocalDateTime,
    val content: String,
    val rawPayload: JsonNode,
) : SearchItem {
    override fun toGraphql(): SearchItemGraphql = AppSearchItemGraphql.newBuilder()
        .sources(sources)
        .sourceId(sourceId)
        .title(title)
        .content(content)
        .rawPayload(rawPayload)
        .createdDatetime(createdDatetime)
        .build()

    companion object {
        fun from(hit: AppContent): SearchAppContentItem =
            SearchAppContentItem(
                sources = SourceType.APP,
                sourceId = hit.sourceId,
                title = hit.title,
                createdDatetime = hit.createdDatetime,
                content = hit.content,
                rawPayload = hit.rawPayload,
            )
    }
}

data class SearchSourceError(
    val sourceType: SourceType,
    val code: SourceErrorCode,
    val message: String,
) {
    fun toGraphql(): SearchSourceErrorGraphql = SearchSourceErrorGraphql.newBuilder()
        .sourceType(sourceType)
        .code(code)
        .message(message)
        .build()

    companion object {
        fun of(
            sourceType: SourceType,
            code: SourceErrorCode,
            message: String,
        ): SearchSourceError =
            SearchSourceError(
                sourceType = sourceType,
                code = code,
                message = message,
            )
    }
}
