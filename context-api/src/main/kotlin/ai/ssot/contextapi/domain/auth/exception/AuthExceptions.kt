package ai.ssot.contextapi.domain.auth.exception

import ai.ssot.contextapi.shared.exception.CustomException
import ai.ssot.contextapi.shared.graphql.MutationErrorCode

class UnauthenticatedException : CustomException(
    code = MutationErrorCode.UNAUTHENTICATED,
    message = "Authentication is required.",
)

class ForbiddenException(
    message: String = "You do not have permission to perform this action.",
) : CustomException(
    code = MutationErrorCode.FORBIDDEN,
    message = message,
)

class InvalidCredentialsException : CustomException(
    code = MutationErrorCode.INVALID_CREDENTIALS,
    message = "Invalid email or password.",
)

class InvalidRefreshTokenException : CustomException(
    code = MutationErrorCode.INVALID_REFRESH_TOKEN,
    message = "Refresh token is invalid or expired.",
)
