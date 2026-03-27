package ai.ssot.contextapi.domain.app.dto

import ai.ssot.contextapi.generated.types.App
import java.time.LocalDateTime
import java.util.*

data class AppDto(
    val id: UUID,
    val name: String,
    val port: Int,
    val isEnabled: Boolean,
    val createdDatetime: LocalDateTime,
) {
    fun toGraphQL(): App {
        return App.newBuilder()
            .id(id.toString())
            .name(name)
            .port(port)
            .isEnabled(isEnabled)
            .createdDatetime(createdDatetime)
            .build()
    }
}