package ai.ssot.contextapi.shared.exception

class RequiredFieldException(fieldName: String) : CustomException(
    message = "$fieldName is required.",
    field = fieldName,
)
