package ai.ssot.contextapi.domain.app.controller

import ai.ssot.contextapi.domain.app.service.AppService
import ai.ssot.contextapi.generated.types.ActivateAppInput
import ai.ssot.contextapi.generated.types.App
import ai.ssot.contextapi.generated.types.AppPage
import ai.ssot.contextapi.generated.types.DeactivateAppInput
import ai.ssot.contextapi.shared.page.PageInfo
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsMutation
import com.netflix.graphql.dgs.DgsQuery
import com.netflix.graphql.dgs.InputArgument

@DgsComponent
class AppController(
    private val appService: AppService,
) {
    @DgsQuery
    fun apps(@InputArgument page: Int, @InputArgument size: Int): AppPage {
        return appService.getAll(page, size).let { (contents, pageInfo) ->
            AppPage(
                contents.map {
                    App(
                        it.id.toString(),
                        it.name,
                        it.port,
                        it.isEnabled,
                        it.createdDatetime
                    )
                },
                PageInfo(
                    page = pageInfo.page,
                    size = pageInfo.size,
                    totalElements = pageInfo.totalElements,
                    totalPages = pageInfo.totalPages,
                )
            )
        }
    }

    @DgsQuery
    fun app(@InputArgument id: String): App = appService.getDtoById(id).toGraphQL()

    @DgsMutation
    fun activateApp(@InputArgument input: ActivateAppInput): App {
        appService.updateIsEnabled(input.id, true)
        return appService.getDtoById(input.id).toGraphQL()
    }
    @DgsMutation
    fun deactivateApp(@InputArgument input: DeactivateAppInput): App {
        appService.updateIsEnabled(input.id, false)
        return appService.getDtoById(input.id).toGraphQL()
    }
}
