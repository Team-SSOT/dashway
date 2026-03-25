package ai.ssot.contextapi.domain.auth.service

import ai.ssot.contextapi.domain.auth.exception.ForbiddenException
import ai.ssot.contextapi.domain.auth.exception.UnauthenticatedException
import ai.ssot.contextapi.domain.member.service.MemberAuthLookupService
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service

data class AuthenticatedViewer(
    val memberId: Long,
    val email: String,
    val admin: Boolean,
)

interface CurrentViewerService {
    fun requireAuthenticated(): AuthenticatedViewer

    fun requireAdmin(): AuthenticatedViewer

    fun requireAdminOrSelf(memberId: Long): AuthenticatedViewer
}

@Service
class SecurityContextCurrentViewerService(
    private val memberAuthLookupService: MemberAuthLookupService,
) : CurrentViewerService {
    override fun requireAuthenticated(): AuthenticatedViewer {
        val authentication = SecurityContextHolder.getContext().authentication
            ?: throw UnauthenticatedException()
        val memberId = authentication.principal.toString().toLongOrNull()
            ?: throw UnauthenticatedException()
        val member = memberAuthLookupService.findById(memberId)
            ?: throw UnauthenticatedException()

        if (!member.enabled) {
            throw UnauthenticatedException()
        }

        return AuthenticatedViewer(
            memberId = member.id,
            email = member.email,
            admin = member.admin,
        )
    }

    override fun requireAdmin(): AuthenticatedViewer =
        requireAuthenticated().also {
            if (!it.admin) {
                throw ForbiddenException()
            }
        }

    override fun requireAdminOrSelf(memberId: Long): AuthenticatedViewer =
        requireAuthenticated().also {
            if (!it.admin && it.memberId != memberId) {
                throw ForbiddenException()
            }
        }
}
