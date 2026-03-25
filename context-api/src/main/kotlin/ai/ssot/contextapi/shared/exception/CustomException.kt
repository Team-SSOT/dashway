package ai.ssot.contextapi.shared.exception

enum class ErrorCode {
    NOT_FOUND,
    VALIDATION_ERROR,
    DUPLICATE_MEMBER_EMAIL,
    TEAM_NOT_EMPTY,
    APP_ALREADY_DISABLED,
    MEMBERSHIP_ALREADY_EXISTS,
    MEMBERSHIP_NOT_FOUND,
    UNAUTHENTICATED,
    FORBIDDEN,
    INVALID_CREDENTIALS,
    INVALID_REFRESH_TOKEN,
    INTERNAL_SERVER_ERROR,
}

enum class ErrorCategory {
    VALIDATION,
    AUTHENTICATION,
    AUTHORIZATION,
    NOT_FOUND,
    CONFLICT,
    INTERNAL,
}

data class ErrorDescriptor(
    val code: ErrorCode,
    val category: ErrorCategory,
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
        code: ErrorCode,
        category: ErrorCategory,
        message: String,
        field: String? = null,
        details: Map<String, Any?> = emptyMap(),
    ) : this(
        listOf(
            ErrorDescriptor(
                code = code,
                category = category,
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
