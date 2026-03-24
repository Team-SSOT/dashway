package ai.ssot.contextapi.shared.exception

import ai.ssot.contextapi.shared.graphql.MutationErrorCode

class RequiredFieldException(fieldName: String) : CustomException(
    code = MutationErrorCode.VALIDATION_ERROR,
    message = "$fieldName is required.",
)
