package ai.ssot.contextapi.domain.app.service

import java.util.*

internal fun parseAppId(rawId: String): UUID? =
    try {
        UUID.fromString(rawId)
    } catch (_: IllegalArgumentException) {
        null
    }
