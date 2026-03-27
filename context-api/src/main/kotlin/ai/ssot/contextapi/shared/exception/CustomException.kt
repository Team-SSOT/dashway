package ai.ssot.contextapi.shared.exception

data class ErrorDescriptor(
    val message: String,
    val field: String? = null,
    val details: Map<String, Any?> = emptyMap(),
)

abstract class CustomException : RuntimeException {
    val errors: List<ErrorDescriptor>

    protected constructor(errors: List<ErrorDescriptor>) : super(
        errors.firstOrNull()?.message ?: "Context API error.",
    ) {
        require(errors.isNotEmpty()) { "ContextApiException requires at least one error." }
        this.errors = errors
    }

    protected constructor(
        message: String,
        field: String? = null,
        details: Map<String, Any?> = emptyMap(),
    ) : this(
        listOf(
            ErrorDescriptor(
                message = message,
                field = field,
                details = details,
            ),
        ),
    )
}

class CombinedCustomException(
    exceptions: List<CustomException>,
) : CustomException(exceptions.flatMap { it.errors }) {
    init {
        require(exceptions.isNotEmpty()) { "CombinedContextApiException requires at least one exception." }
    }
}
