package ai.ssot.contextapi.domain.app.service

import ai.ssot.contextapi.domain.app.dto.AppDto
import ai.ssot.contextapi.domain.app.dto.AppPage
import ai.ssot.contextapi.domain.app.dto.DeactivateAppInput
import ai.ssot.contextapi.domain.app.dto.RegisterAppInput
import ai.ssot.contextapi.domain.app.entity.App
import ai.ssot.contextapi.domain.app.exception.AppAlreadyDisabledException
import ai.ssot.contextapi.domain.app.exception.AppNotFoundException
import ai.ssot.contextapi.domain.app.exception.InvalidAppIdException
import ai.ssot.contextapi.domain.app.repository.AppRepository
import ai.ssot.contextapi.domain.auth.service.CurrentViewerService
import ai.ssot.contextapi.shared.page.PageInfo
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
        val appPage = appRepository.findAll(PageSupport.pageRequest(page, size))
        return AppPage(
            apps = appPage.content.map { app ->
                AppDto(
                    id = app.id.toString(),
                    name = app.name,
                    enabled = app.enabled,
                    createdDatetime = app.createdDatetime,
                )
            },
            pageInfo = PageInfo(
                page = appPage.number,
                size = appPage.size,
                totalElements = appPage.totalElements.toInt(),
                totalPages = appPage.totalPages,
            ),
        )
    }

    @Transactional(readOnly = true)
    fun app(id: String): AppDto? {
        currentViewerService.requireAdmin()
        val appId = parseAppId(id) ?: throw InvalidAppIdException(id)
        val app = appRepository.findById(appId).orElse(null) ?: return null
        return AppDto(
            id = app.id.toString(),
            name = app.name,
            enabled = app.enabled,
            createdDatetime = app.createdDatetime,
        )
    }

    @Transactional
    fun registerApp(input: RegisterAppInput): AppDto {
        currentViewerService.requireAdmin()
        val name = input.name.trim()
        requireNonBlankText("name", name)

        val savedApp = appRepository.save(
            App(
                name = name,
                enabled = input.enabled ?: true,
            ),
        )
        return AppDto(
            id = savedApp.id.toString(),
            name = savedApp.name,
            enabled = savedApp.enabled,
            createdDatetime = savedApp.createdDatetime,
        )
    }

    @Transactional
    fun deactivateApp(input: DeactivateAppInput): AppDto {
        currentViewerService.requireAdmin()
        val appId = parseAppId(input.id) ?: throw InvalidAppIdException(input.id)
        val app = appRepository.findById(appId).orElseThrow { AppNotFoundException(appId) }

        if (!app.enabled) {
            throw AppAlreadyDisabledException(appId)
        }

        app.enabled = false
        val savedApp = appRepository.save(app)
        return AppDto(
            id = savedApp.id.toString(),
            name = savedApp.name,
            enabled = savedApp.enabled,
            createdDatetime = savedApp.createdDatetime,
        )
    }
}
