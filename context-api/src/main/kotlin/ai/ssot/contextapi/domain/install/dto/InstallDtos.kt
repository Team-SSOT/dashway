package ai.ssot.contextapi.domain.install.dto

data class InstallBootstrapRequest(
    val admin: InstallAdminRequest = InstallAdminRequest(),
    val apps: List<InstallAppRequest> = emptyList(),
    val selectedAppIds: List<String> = emptyList(),
)

data class InstallAdminRequest(
    val name: String = "",
    val email: String = "",
    val password: String = "",
)

data class InstallAppRequest(
    val id: String = "",
    val name: String = "",
    val port: Int = 0,
)

data class InstallBootstrapResponse(
    val adminCreated: Boolean,
    val adminEmail: String,
    val syncedAppCount: Int,
    val enabledAppIds: List<String>,
)

data class InstallHealthResponse(
    val status: String = "ok",
)
