package ai.ssot.contextapi.domain.auth.controller

import ai.ssot.contextapi.domain.auth.service.AuthorityService
import ai.ssot.contextapi.domain.auth.service.withAuthenticatedMember
import ai.ssot.contextapi.generated.types.Authority
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsQuery

@DgsComponent
class AuthorityController(
    private val authorityService: AuthorityService,
) {
    @DgsQuery
    fun authorities(): List<Authority> =
        withAuthenticatedMember {
            authorityService.getAllDtos()
                .map { it.toGraphQL() }
        }
}
