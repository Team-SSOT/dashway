package ai.ssot.contextapi.security.principal

data class AuthenticatedMemberPrincipal(
    val memberId: Long,
    val email: String,
    val admin: Boolean,
)
