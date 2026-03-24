package ai.ssot.contextapi.shared.exception

import ai.ssot.contextapi.shared.graphql.MutationError
import ai.ssot.contextapi.shared.graphql.MutationErrorCode

abstract class CustomException : RuntimeException {
    val errors: List<MutationError>

    protected constructor(errors: List<MutationError>) : super(
        errors.firstOrNull()?.message ?: "Context API error.",
    ) {
        require(errors.isNotEmpty()) { "ContextApiException requires at least one mutation error." }
        this.errors = errors
    }

    protected constructor(code: MutationErrorCode, message: String) : this(
        listOf(MutationError(code = code, message = message)),
    )
}

class CombinedCustomException(
    exceptions: List<CustomException>,
) : CustomException(exceptions.flatMap { it.errors }) {
    init {
        require(exceptions.isNotEmpty()) { "CombinedContextApiException requires at least one exception." }
    }
}
