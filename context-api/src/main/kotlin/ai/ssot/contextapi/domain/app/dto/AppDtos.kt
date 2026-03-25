package ai.ssot.contextapi.domain.app.dto

import ai.ssot.contextapi.shared.page.PageInfo
import java.time.LocalDateTime

data class RegisterAppInput(
    val name: String,
    val enabled: Boolean? = null,
)

data class DeactivateAppInput(
    val id: String,
)

data class AppDto(
    val id: String,
    val name: String,
    val enabled: Boolean,
    val createdDatetime: LocalDateTime,
)

data class AppPage(
    val apps: List<AppDto>,
    val pageInfo: PageInfo
)
