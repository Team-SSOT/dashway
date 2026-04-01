package ai.ssot.contextapi.domain.auth.exception

import ai.ssot.contextapi.shared.exception.CustomException

class UnauthenticatedException : CustomException(
    message = "Authentication is required.",
)

class ForbiddenException(
    message: String = "You do not have permission to perform this action.",
) : CustomException(
    message = message,
)

class LoginFailureException : CustomException(
    message = "Invalid email or password.",
)

class InvalidRefreshTokenException : CustomException(
    message = "Refresh token is invalid or expired.",
)

class AuthorityEmptyException: CustomException(
    message = "Authority must be existed."
)