package ai.ssot.contextapi.domain.app.controller

import ai.ssot.contextapi.domain.app.dto.AppDto
import ai.ssot.contextapi.domain.app.dto.AppPage
import ai.ssot.contextapi.domain.app.dto.DeactivateAppInput
import ai.ssot.contextapi.domain.app.dto.RegisterAppInput
import ai.ssot.contextapi.domain.app.service.AppService
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
    fun app(@InputArgument id: String): AppDto? = appService.app(id)

    @DgsMutation
    fun registerApp(@InputArgument input: RegisterAppInput): AppDto = appService.registerApp(input)

    @DgsMutation
    fun deactivateApp(@InputArgument input: DeactivateAppInput): AppDto = appService.deactivateApp(input)
}
