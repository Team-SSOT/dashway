package ai.ssot.contextapi.domain.auth.controller

import ai.ssot.contextapi.domain.auth.dto.TokenValidateResponse
import ai.ssot.contextapi.security.exception.UnauthenticatedException
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/auth/token")
class AuthTokenController {
    @PostMapping("/validate")
    fun validate(): TokenValidateResponse =
        TokenValidateResponse(
            memberId = currentAuthenticatedMemberId(),
        )

    private fun currentAuthenticatedMemberId(): Long =
        SecurityContextHolder.getContext()
            .authentication
            ?.principal
            ?.toString()
            ?.toLongOrNull()
            ?: throw UnauthenticatedException()
}
