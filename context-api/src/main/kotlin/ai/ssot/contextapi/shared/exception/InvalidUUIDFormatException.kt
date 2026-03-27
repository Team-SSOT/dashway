package ai.ssot.contextapi.shared.exception

class InvalidUUIDFormatException(
    message: String = "UUID must be a valid UUID string.",
) : CustomException(
    code = ErrorCode.VALIDATION_ERROR,
    category = ErrorCategory.VALIDATION,
    message = message,
)
