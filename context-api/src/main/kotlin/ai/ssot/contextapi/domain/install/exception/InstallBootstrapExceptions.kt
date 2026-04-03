package ai.ssot.contextapi.domain.install.exception

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

@ResponseStatus(HttpStatus.NOT_FOUND)
class InstallBootstrapDisabledException : RuntimeException(
    "Install bootstrap is disabled.",
)

@ResponseStatus(HttpStatus.FORBIDDEN)
class InstallBootstrapForbiddenException : RuntimeException(
    "Install bootstrap secret is invalid.",
)

@ResponseStatus(HttpStatus.BAD_REQUEST)
class InstallBootstrapBadRequestException(
    message: String,
) : RuntimeException(message)

@ResponseStatus(HttpStatus.CONFLICT)
class InstallBootstrapConflictException(
    message: String,
) : RuntimeException(message)
