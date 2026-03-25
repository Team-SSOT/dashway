package ai.ssot.contextapi.domain.auth.controller

import ai.ssot.contextapi.domain.auth.dto.AuthSessionDto
import ai.ssot.contextapi.domain.auth.dto.LoginInput
import ai.ssot.contextapi.domain.auth.dto.LogoutInput
import ai.ssot.contextapi.domain.auth.dto.RefreshTokenInput
import ai.ssot.contextapi.domain.auth.service.AuthService
import ai.ssot.contextapi.domain.member.dto.MemberDto
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsMutation
import com.netflix.graphql.dgs.DgsQuery
import com.netflix.graphql.dgs.InputArgument

@DgsComponent
class AuthController(
    private val authService: AuthService,
) {
    @DgsQuery
    fun me(): MemberDto? = authService.me()

    @DgsMutation
    fun login(@InputArgument input: LoginInput): AuthSessionDto = authService.login(input)

    @DgsMutation
    fun refreshToken(@InputArgument input: RefreshTokenInput): AuthSessionDto = authService.refreshToken(input)

    @DgsMutation
    fun logout(@InputArgument input: LogoutInput): Boolean = authService.logout(input)
}
