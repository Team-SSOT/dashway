package ai.ssot.contextapi.domain.app.exception

import ai.ssot.contextapi.shared.exception.CustomException
import ai.ssot.contextapi.shared.graphql.MutationErrorCode
import java.util.UUID

class InvalidAppIdException(rawId: String) : CustomException(
    code = MutationErrorCode.VALIDATION_ERROR,
    message = "App id must be a UUID.",
)

class AppNotFoundException(appId: UUID) : CustomException(
    code = MutationErrorCode.NOT_FOUND,
    message = "App not found.",
)

class AppAlreadyDisabledException(appId: UUID) : CustomException(
    code = MutationErrorCode.APP_ALREADY_DISABLED,
    message = "App is already disabled.",
)
