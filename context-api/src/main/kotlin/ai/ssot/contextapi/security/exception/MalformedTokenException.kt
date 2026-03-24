package ai.ssot.contextapi.security.exception

import org.springframework.security.core.AuthenticationException

class MalformedTokenException: AuthenticationException("Token is Malformed")