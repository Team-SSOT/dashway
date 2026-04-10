package ai.ssot.contextapi.domain.search.controller

import ai.ssot.contextapi.generated.DgsConstants
import ai.ssot.contextapi.generated.types.AppSearchItem
import ai.ssot.contextapi.generated.types.MemberSearchItem
import ai.ssot.contextapi.generated.types.SearchItem
import ai.ssot.contextapi.generated.types.TeamSearchItem
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsTypeResolver

@DgsComponent
class SearchTypeResolver {
    @DgsTypeResolver(name = DgsConstants.SEARCHITEM.TYPE_NAME)
    fun resolve(searchItem: SearchItem): String =
        when (searchItem) {
            is MemberSearchItem -> DgsConstants.MEMBERSEARCHITEM.TYPE_NAME
            is TeamSearchItem -> DgsConstants.TEAMSEARCHITEM.TYPE_NAME
            is AppSearchItem -> DgsConstants.APPSEARCHITEM.TYPE_NAME
            else -> error("Unsupported search item type: ${searchItem::class.qualifiedName}")
        }
}
