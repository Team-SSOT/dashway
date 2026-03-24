package ai.ssot.contextapi.security.exception

import org.springframework.security.core.AuthenticationException

class TokenExpirationException: AuthenticationException("Token is expired")