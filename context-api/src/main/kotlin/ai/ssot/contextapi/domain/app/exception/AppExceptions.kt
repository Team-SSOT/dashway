package ai.ssot.contextapi.domain.app.exception

import ai.ssot.contextapi.shared.exception.CustomException
import ai.ssot.contextapi.shared.exception.ErrorCategory
import ai.ssot.contextapi.shared.exception.ErrorCode
import java.util.*

class InvalidAppIdException(rawId: String) : CustomException(
    code = ErrorCode.VALIDATION_ERROR,
    category = ErrorCategory.VALIDATION,
    message = "App id must be a UUID.",
    field = "id",
)

class AppNotFoundException(appId: UUID) : CustomException(
    code = ErrorCode.NOT_FOUND,
    category = ErrorCategory.NOT_FOUND,
    message = "App not found.",
)

class AppAlreadyDisabledException(appId: UUID) : CustomException(
    code = ErrorCode.APP_ALREADY_DISABLED,
    category = ErrorCategory.CONFLICT,
    message = "App is already disabled.",
)
