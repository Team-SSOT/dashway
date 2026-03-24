package ai.ssot.contextapi.security.exception

import org.springframework.security.core.AuthenticationException

class InvalidTokenPrefixException: AuthenticationException("Invalid Token Prefix")