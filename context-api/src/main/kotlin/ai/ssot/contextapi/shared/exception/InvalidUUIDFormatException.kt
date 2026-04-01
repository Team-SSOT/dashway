package ai.ssot.contextapi.shared.exception

class InvalidUUIDFormatException(
    message: String = "UUID must be a valid UUID string.",
) : CustomException(
    message = message,
)
