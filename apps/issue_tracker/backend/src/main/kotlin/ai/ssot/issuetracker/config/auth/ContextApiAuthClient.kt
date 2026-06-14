package ai.ssot.issuetracker.config.auth

import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientException

@Component
class ContextApiAuthClient(
    @Qualifier("contextApiRestClient")
    private val restClient: RestClient,
) {
    fun validate(authorizationHeader: String): Long {
        val response = try {
            restClient.post()
                .uri("/api/auth/token/validate")
                .header("Authorization", authorizationHeader)
                .retrieve()
                .body(TokenValidateResponse::class.java)
        } catch (exception: RestClientException) {
            throw BadCredentialsException("Authentication is required.", exception)
        }

        return response?.memberId ?: throw BadCredentialsException("Authentication is required.")
    }
}

data class TokenValidateResponse(
    val memberId: Long,
)
