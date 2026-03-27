package ai.ssot.contextapi.shared.utils

import ai.ssot.contextapi.shared.exception.InvalidUUIDFormatException
import java.util.UUID

fun parseFromString(str: String): UUID {
    try {
        return UUID.fromString(str)
    } catch (e: IllegalArgumentException) {
        throw InvalidUUIDFormatException(e.message?:"Parse Error String to UUID")
    }
}