package ai.ssot.contextapi.domain.app.dto

import ai.ssot.contextapi.shared.graphql.MutationError
import java.time.LocalDateTime

data class RegisterAppInput(
    val name: String,
    val enabled: Boolean? = null,
)

data class DeactivateAppInput(
    val id: String,
)

data class AppView(
    val id: String,
    val name: String,
    val enabled: Boolean,
    val createdAt: LocalDateTime,
)

data class AppPage(
    val items: List<AppView>,
    val page: Int,
    val size: Int,
    val totalElements: Int,
    val totalPages: Int,
)

data class RegisterAppPayload(
    val app: AppView? = null,
    val errors: List<MutationError> = emptyList(),
)

data class DeactivateAppPayload(
    val app: AppView? = null,
    val errors: List<MutationError> = emptyList(),
)
