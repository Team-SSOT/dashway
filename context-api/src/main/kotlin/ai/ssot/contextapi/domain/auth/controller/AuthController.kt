package ai.ssot.contextapi.domain.auth.controller

import ai.ssot.contextapi.domain.auth.dto.LoginInput
import ai.ssot.contextapi.domain.auth.dto.LoginPayload
import ai.ssot.contextapi.domain.auth.dto.LogoutInput
import ai.ssot.contextapi.domain.auth.dto.LogoutPayload
import ai.ssot.contextapi.domain.auth.dto.RefreshTokenInput
import ai.ssot.contextapi.domain.auth.dto.RefreshTokenPayload
import ai.ssot.contextapi.domain.auth.service.AuthService
import ai.ssot.contextapi.domain.member.dto.MemberView
import ai.ssot.contextapi.shared.graphql.executeMutation
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsMutation
import com.netflix.graphql.dgs.DgsQuery
import com.netflix.graphql.dgs.InputArgument

@DgsComponent
class AuthController(
    private val authService: AuthService,
) {
    @DgsQuery
    fun me(): MemberView? = authService.me()

    @DgsMutation
    fun login(@InputArgument input: LoginInput): LoginPayload =
        executeMutation(
            action = { authService.login(input) },
            onError = { LoginPayload(errors = it) },
        )

    @DgsMutation
    fun refreshToken(@InputArgument input: RefreshTokenInput): RefreshTokenPayload =
        executeMutation(
            action = { authService.refreshToken(input) },
            onError = { RefreshTokenPayload(errors = it) },
        )

    @DgsMutation
    fun logout(@InputArgument input: LogoutInput): LogoutPayload =
        executeMutation(
            action = { authService.logout(input) },
            onError = { LogoutPayload(errors = it) },
        )
}
