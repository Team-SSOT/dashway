package ai.ssot.contextapi.domain.app.service

import ai.ssot.contextapi.domain.app.dto.AppDto
import ai.ssot.contextapi.domain.app.exception.AppNotFoundException
import ai.ssot.contextapi.domain.app.repository.AppRepository
import ai.ssot.contextapi.shared.page.PageResult
import ai.ssot.contextapi.shared.page.PageSupport
import ai.ssot.contextapi.shared.utils.parseFromString
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AppService(
    private val appRepository: AppRepository,
) {
    @Transactional(readOnly = true)
    fun getAll(page: Int, size: Int): PageResult<AppDto> {
        val appPage = appRepository.findAll(PageSupport.pageRequest(page, size))
            .map { app ->
                AppDto(
                    id = app.id,
                    name = app.name,
                    port = app.port,
                    isEnabled = app.isEnabled,
                    createdDatetime = app.createdDatetime
                )
            }

        return PageResult(appPage)
    }

    @Transactional(readOnly = true)
    fun getDtoById(id: String): AppDto {
        val appId = parseFromString(id)

        return appRepository.findById(appId)
            .map {
                AppDto(
                    id = it.id,
                    name = it.name,
                    port = it.port,
                    isEnabled = it.isEnabled,
                    createdDatetime = it.createdDatetime,
                )
            }.orElseThrow { AppNotFoundException(appId) }
    }

    @Transactional
    fun updateIsEnabled(id: String, isEnabled: Boolean) {
        appRepository.updateIsEnabled(parseFromString(id), isEnabled)
    }
}
