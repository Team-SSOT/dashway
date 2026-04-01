package ai.ssot.contextapi.domain.app.exception

import ai.ssot.contextapi.shared.exception.CustomException
import java.util.*

class InvalidAppIdException(rawId: String) : CustomException(
    message = "App id must be a UUID.",
    field = "id",
)

class AppNotFoundException(appId: UUID) : CustomException(
    message = "App not found.",
)

class AppAlreadyDisabledException(appId: UUID) : CustomException(
    message = "App is already disabled.",
)
