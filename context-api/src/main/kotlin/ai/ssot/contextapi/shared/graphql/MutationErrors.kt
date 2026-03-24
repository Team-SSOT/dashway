package ai.ssot.contextapi.shared.graphql

enum class MutationErrorCode {
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
}

data class MutationError(
    val code: MutationErrorCode,
    val message: String,
)
