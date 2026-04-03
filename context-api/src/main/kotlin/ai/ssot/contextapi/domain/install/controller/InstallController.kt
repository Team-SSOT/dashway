package ai.ssot.contextapi.domain.install.controller

import ai.ssot.contextapi.domain.install.InstallProperties
import ai.ssot.contextapi.domain.install.dto.InstallBootstrapRequest
import ai.ssot.contextapi.domain.install.dto.InstallBootstrapResponse
import ai.ssot.contextapi.domain.install.dto.InstallHealthResponse
import ai.ssot.contextapi.domain.install.exception.InstallBootstrapBadRequestException
import ai.ssot.contextapi.domain.install.exception.InstallBootstrapDisabledException
import ai.ssot.contextapi.domain.install.exception.InstallBootstrapForbiddenException
import ai.ssot.contextapi.domain.install.service.InstallBootstrapService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/internal/install")
class InstallController(
    private val installBootstrapService: InstallBootstrapService,
    private val installProperties: InstallProperties,
) {
    @GetMapping("/health")
    fun health(): InstallHealthResponse {
        requireBootstrapEnabled()
        return InstallHealthResponse()
    }

    @PostMapping("/bootstrap")
    fun bootstrap(
        @RequestHeader(InstallProperties.BOOTSTRAP_SECRET_HEADER, required = false)
        installSecret: String?,
        @RequestBody request: InstallBootstrapRequest,
    ): InstallBootstrapResponse {
        requireBootstrapEnabled()
        requireValidSecret(installSecret)
        validate(request)
        return installBootstrapService.bootstrap(request)
    }

    private fun requireBootstrapEnabled() {
        if (!installProperties.bootstrapEnabled) {
            throw InstallBootstrapDisabledException()
        }
    }

    private fun requireValidSecret(installSecret: String?) {
        if (installSecret.isNullOrBlank() || installSecret != installProperties.bootstrapSecret) {
            throw InstallBootstrapForbiddenException()
        }
    }

    private fun validate(request: InstallBootstrapRequest) {
        if (request.admin.name.isBlank()) {
            throw InstallBootstrapBadRequestException("Bootstrap admin name must not be blank.")
        }
        if (request.admin.email.isBlank()) {
            throw InstallBootstrapBadRequestException("Bootstrap admin email must not be blank.")
        }
        if (request.admin.password.isBlank()) {
            throw InstallBootstrapBadRequestException("Bootstrap admin password must not be blank.")
        }

        val duplicateAppIds = request.apps.groupingBy { it.id }.eachCount()
            .filterValues { it > 1 }
            .keys
        if (duplicateAppIds.isNotEmpty()) {
            throw InstallBootstrapBadRequestException(
                "Bootstrap apps contain duplicate ids: ${duplicateAppIds.joinToString(", ")}.",
            )
        }

        request.apps.forEach { app ->
            if (app.id.isBlank()) {
                throw InstallBootstrapBadRequestException("Bootstrap app id must not be blank.")
            }
            if (app.name.isBlank()) {
                throw InstallBootstrapBadRequestException("Bootstrap app name must not be blank.")
            }
            if (app.port <= 0) {
                throw InstallBootstrapBadRequestException(
                    "Bootstrap app port for ${app.id} must be a positive integer.",
                )
            }
        }

        val appIds = request.apps.map { it.id }.toSet()
        val unknownSelectedIds = request.selectedAppIds.distinct()
            .filterNot(appIds::contains)
        if (unknownSelectedIds.isNotEmpty()) {
            throw InstallBootstrapBadRequestException(
                "Selected app ids are missing from bootstrap apps: ${unknownSelectedIds.joinToString(", ")}.",
            )
        }
    }
}
