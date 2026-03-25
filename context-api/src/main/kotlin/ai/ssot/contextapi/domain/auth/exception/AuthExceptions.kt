package ai.ssot.contextapi.domain.auth.exception

import ai.ssot.contextapi.shared.exception.CustomException
import ai.ssot.contextapi.shared.exception.ErrorCategory
import ai.ssot.contextapi.shared.exception.ErrorCode

class UnauthenticatedException : CustomException(
    code = ErrorCode.UNAUTHENTICATED,
    category = ErrorCategory.AUTHENTICATION,
    message = "Authentication is required.",
)

class ForbiddenException(
    message: String = "You do not have permission to perform this action.",
) : CustomException(
    code = ErrorCode.FORBIDDEN,
    category = ErrorCategory.AUTHORIZATION,
    message = message,
)

class InvalidCredentialsException : CustomException(
    code = ErrorCode.INVALID_CREDENTIALS,
    category = ErrorCategory.AUTHENTICATION,
    message = "Invalid email or password.",
)

class InvalidRefreshTokenException : CustomException(
    code = ErrorCode.INVALID_REFRESH_TOKEN,
    category = ErrorCategory.AUTHENTICATION,
    message = "Refresh token is invalid or expired.",
)
