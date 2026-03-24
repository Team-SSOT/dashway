package ai.ssot.contextapi.domain.app.service

import ai.ssot.contextapi.domain.app.dto.AppPage
import ai.ssot.contextapi.domain.app.dto.AppView
import ai.ssot.contextapi.domain.app.dto.DeactivateAppInput
import ai.ssot.contextapi.domain.app.dto.DeactivateAppPayload
import ai.ssot.contextapi.domain.app.dto.RegisterAppInput
import ai.ssot.contextapi.domain.app.dto.RegisterAppPayload
import ai.ssot.contextapi.domain.app.entity.App
import ai.ssot.contextapi.domain.app.exception.AppAlreadyDisabledException
import ai.ssot.contextapi.domain.app.exception.AppNotFoundException
import ai.ssot.contextapi.domain.app.exception.InvalidAppIdException
import ai.ssot.contextapi.domain.app.repository.AppRepository
import ai.ssot.contextapi.domain.auth.service.CurrentViewerService
import ai.ssot.contextapi.shared.page.PageSupport
import ai.ssot.contextapi.shared.validation.requireNonBlankText
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AppService(
    private val appRepository: AppRepository,
    private val currentViewerService: CurrentViewerService,
) {
    @Transactional(readOnly = true)
    fun apps(page: Int, size: Int): AppPage {
        currentViewerService.requireAdmin()
        return appRepository.findAll(PageSupport.pageRequest(page, size)).toAppPage()
    }

    @Transactional(readOnly = true)
    fun app(id: String): AppView? {
        currentViewerService.requireAdmin()
        return parseAppId(id)?.let { appRepository.findById(it).orElse(null)?.toView() }
    }

    @Transactional
    fun registerApp(input: RegisterAppInput): RegisterAppPayload {
        currentViewerService.requireAdmin()
        val name = input.name.trim()
        requireNonBlankText("name", name)

        val savedApp = appRepository.save(
            App(
                name = name,
                enabled = input.enabled ?: true,
            ),
        )
        return RegisterAppPayload(app = savedApp.toView())
    }

    @Transactional
    fun deactivateApp(input: DeactivateAppInput): DeactivateAppPayload {
        currentViewerService.requireAdmin()
        val appId = parseAppId(input.id) ?: throw InvalidAppIdException(input.id)
        val app = appRepository.findById(appId).orElseThrow { AppNotFoundException(appId) }

        if (!app.enabled) {
            throw AppAlreadyDisabledException(appId)
        }

        app.enabled = false
        return DeactivateAppPayload(app = appRepository.save(app).toView())
    }
}
