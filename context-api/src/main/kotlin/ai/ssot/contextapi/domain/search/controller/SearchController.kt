package ai.ssot.contextapi.domain.search.controller

import ai.ssot.contextapi.domain.auth.service.withAuthenticatedMember
import ai.ssot.contextapi.domain.search.dto.SearchInput
import ai.ssot.contextapi.domain.search.service.SearchService
import ai.ssot.contextapi.generated.types.SearchResult
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsQuery
import com.netflix.graphql.dgs.InputArgument
import ai.ssot.contextapi.generated.types.SearchInput as SearchInputQL

@DgsComponent
class SearchController(
    private val searchService: SearchService,
) {
    @DgsQuery
    fun search(@InputArgument input: SearchInputQL): SearchResult =
        withAuthenticatedMember { memberId ->
            searchService.search(
                memberId,
                input = SearchInput.from(input),
            ).toGraphql()
        }
}
