package ai.ssot.contextapi.shared.exception

class RequiredFieldException(fieldName: String) : CustomException(
    code = ErrorCode.VALIDATION_ERROR,
    category = ErrorCategory.VALIDATION,
    message = "$fieldName is required.",
    field = fieldName,
)
