package ai.ssot.contextapi.domain.app.service

import ai.ssot.contextapi.domain.app.dto.AppPage
import ai.ssot.contextapi.domain.app.dto.AppView
import ai.ssot.contextapi.domain.app.entity.App
import org.springframework.data.domain.Page
import java.util.UUID

internal fun parseAppId(rawId: String): UUID? =
    try {
        UUID.fromString(rawId)
    } catch (_: IllegalArgumentException) {
        null
    }

internal fun Page<App>.toAppPage(): AppPage =
    AppPage(
        items = content.map { it.toView() },
        page = number,
        size = size,
        totalElements = totalElements.toInt(),
        totalPages = totalPages,
    )

internal fun App.toView(): AppView =
    AppView(
        id = id.toString(),
        name = name,
        enabled = enabled,
        createdAt = createdDatetime,
    )
