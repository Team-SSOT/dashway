package ai.ssot.contextapi.domain.app.controller

import ai.ssot.contextapi.domain.app.dto.AppPage
import ai.ssot.contextapi.domain.app.dto.AppView
import ai.ssot.contextapi.domain.app.dto.DeactivateAppInput
import ai.ssot.contextapi.domain.app.dto.DeactivateAppPayload
import ai.ssot.contextapi.domain.app.dto.RegisterAppInput
import ai.ssot.contextapi.domain.app.dto.RegisterAppPayload
import ai.ssot.contextapi.domain.app.service.AppService
import ai.ssot.contextapi.shared.graphql.executeMutation
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsMutation
import com.netflix.graphql.dgs.DgsQuery
import com.netflix.graphql.dgs.InputArgument

@DgsComponent
class AppController(
    private val appService: AppService,
) {
    @DgsQuery
    fun apps(
        @InputArgument page: Int,
        @InputArgument size: Int,
    ): AppPage = appService.apps(page, size)

    @DgsQuery
    fun app(@InputArgument id: String): AppView? = appService.app(id)

    @DgsMutation
    fun registerApp(@InputArgument input: RegisterAppInput): RegisterAppPayload =
        executeMutation(
            action = { appService.registerApp(input) },
            onError = { RegisterAppPayload(errors = it) },
        )

    @DgsMutation
    fun deactivateApp(@InputArgument input: DeactivateAppInput): DeactivateAppPayload =
        executeMutation(
            action = { appService.deactivateApp(input) },
            onError = { DeactivateAppPayload(errors = it) },
        )
}
