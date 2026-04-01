package ai.ssot.contextapi.domain.auth.service

import ai.ssot.contextapi.domain.auth.exception.ForbiddenException
import ai.ssot.contextapi.domain.auth.exception.UnauthenticatedException
import org.springframework.security.core.context.SecurityContextHolder

fun requireAuthenticatedMemberId(): Long {
    val authentication = SecurityContextHolder.getContext().authentication
        ?: throw UnauthenticatedException()

    return authentication.principal.toString().toLongOrNull()
        ?: throw UnauthenticatedException()
}


fun <T> withAuthenticatedMember(action: (Long) -> T): T {
    val memberId = getMemberIdFromAuthentication()

    return action(memberId)
}


fun <T> withAdmin(action: (Long) -> T): T {
    val memberId = getMemberIdFromAuthentication()
    if(!checkIsAdmin()) {
        throw ForbiddenException()
    }

    return action(memberId)
}

fun <T> withOwnedOrAdmin(memberId:Long, action: (Long) -> T): T {
    val authenticatedMemberId = getMemberIdFromAuthentication()

    if(authenticatedMemberId != memberId || !checkIsAdmin()) {
        throw ForbiddenException()
    }

    return action(memberId)
}

private fun getMemberIdFromAuthentication(): Long {
    return getAuthentication().principal?.toString()?.toLongOrNull()
        ?: throw UnauthenticatedException()
}

fun checkIsAdmin(): Boolean {
    return getAuthentication()
        .authorities.any { it.authority?.removePrefix("ROLE_") == "ADMIN" }
}

private fun getAuthentication() = SecurityContextHolder.getContext().authentication ?: throw UnauthenticatedException()
