package ai.ssot.contextapi.security

import ai.ssot.contextapi.shared.exception.GraphQlErrors
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.http.MediaType
import org.springframework.security.core.AuthenticationException
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.stereotype.Component
import tools.jackson.module.kotlin.jacksonObjectMapper

@Component
class AuthenticationEntryPoint : AuthenticationEntryPoint {
    private val objectMapper = jacksonObjectMapper()

    override fun commence(
        request: HttpServletRequest,
        response: HttpServletResponse,
        authException: AuthenticationException,
    ) {
        if (response.isCommitted) {
            return
        }

        response.status = HttpServletResponse.SC_OK
        response.contentType = MediaType.APPLICATION_JSON_VALUE
        response.characterEncoding = Charsets.UTF_8.name()
        response.writer.write(
            objectMapper.writeValueAsString(
                mapOf(
                    "data" to null,
                    "errors" to listOf(
                        GraphQlErrors.unauthenticatedError().toSpecification(),
                    ),
                ),
            ),
        )
        response.writer.flush()
    }
}
