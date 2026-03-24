package ai.ssot.contextapi.domain.auth.service

import ai.ssot.contextapi.domain.auth.exception.ForbiddenException
import ai.ssot.contextapi.domain.auth.exception.UnauthenticatedException
import ai.ssot.contextapi.domain.member.service.MemberAuthLookupService
import ai.ssot.contextapi.security.context.AuthenticationContextAccessor
import ai.ssot.contextapi.security.principal.AuthenticatedMemberPrincipal
import org.springframework.stereotype.Service

interface CurrentViewerService {
    fun requireAuthenticated(): AuthenticatedMemberPrincipal

    fun requireAdmin(): AuthenticatedMemberPrincipal

    fun requireAdminOrSelf(memberId: Long): AuthenticatedMemberPrincipal
}

@Service
class SecurityContextCurrentViewerService(
    private val memberAuthLookupService: MemberAuthLookupService,
    private val authenticationContextAccessor: AuthenticationContextAccessor,
) : CurrentViewerService {
    override fun requireAuthenticated(): AuthenticatedMemberPrincipal {
        val principal = authenticationContextAccessor.authenticatedMemberPrincipalOrNull()
            ?: throw UnauthenticatedException()
        val member = memberAuthLookupService.findById(principal.memberId)
            ?: throw UnauthenticatedException()

        if (!member.enabled) {
            throw UnauthenticatedException()
        }

        return AuthenticatedMemberPrincipal(
            memberId = member.id,
            email = member.email,
            admin = member.admin,
        )
    }

    override fun requireAdmin(): AuthenticatedMemberPrincipal =
        requireAuthenticated().also {
            if (!it.admin) {
                throw ForbiddenException()
            }
        }

    override fun requireAdminOrSelf(memberId: Long): AuthenticatedMemberPrincipal =
        requireAuthenticated().also {
            if (!it.admin && it.memberId != memberId) {
                throw ForbiddenException()
            }
        }
}
