package ai.ssot.contextapi.domain.member.controller

import ai.ssot.contextapi.domain.auth.service.withAuthenticatedMember
import ai.ssot.contextapi.domain.auth.service.withOwnedOrAdmin
import ai.ssot.contextapi.domain.member.dto.RegisterMemberDto
import ai.ssot.contextapi.domain.member.dto.UpdateMemberDto
import ai.ssot.contextapi.domain.member.service.MemberRegistrationService
import ai.ssot.contextapi.domain.member.service.MemberService
import ai.ssot.contextapi.generated.types.Member
import ai.ssot.contextapi.generated.types.MemberPage
import ai.ssot.contextapi.generated.types.RegisterMemberInput
import ai.ssot.contextapi.generated.types.UpdateMemberInput
import ai.ssot.contextapi.shared.page.PageInfo
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsMutation
import com.netflix.graphql.dgs.DgsQuery
import com.netflix.graphql.dgs.InputArgument
import graphql.schema.DataFetchingEnvironment
import org.springframework.web.multipart.MultipartFile

@DgsComponent
class MemberController(
    private val memberService: MemberService,
    private val memberRegistrationService: MemberRegistrationService,
) {
    @DgsQuery
    fun members(
        @InputArgument page: Int,
        @InputArgument size: Int,
    ): MemberPage {
        return withAuthenticatedMember {
            memberService.getMemberPageResult(page, size).let { (contents, pageInfo) ->
                MemberPage(
                    contents.map { it.toGraphQL() },
                    PageInfo(
                        page = pageInfo.page,
                        size = pageInfo.size,
                        totalElements = pageInfo.totalElements,
                        totalPages = pageInfo.totalPages,
                    ),
                )
            }
        }
    }

    @DgsQuery
    fun member(@InputArgument id: Long): Member? =
        withAuthenticatedMember {
            memberService.getDtoById(id).toGraphQL()
        }

    @DgsMutation
    fun registerMember(
        @InputArgument input: RegisterMemberInput,
        dfe: DataFetchingEnvironment,
    ): Member =
        memberRegistrationService.register(
            RegisterMemberDto(
                name = input.name,
                email = input.email,
                password = input.password,
                teamId = input.teamId,
                isEnabled = input.isEnabled,
                authorityIds = input.authorityIds,
            ),
            file = resolveFileInput(dfe).file,
        ).toGraphQL()


    @DgsMutation
    fun updateMember(
        @InputArgument input: UpdateMemberInput,
        dfe: DataFetchingEnvironment,
    ): Member =
        withOwnedOrAdmin(input.id) {
            val fileInput = resolveFileInput(dfe)
            memberService.updateMember(
                UpdateMemberDto(
                    id = input.id,
                    name = input.name,
                    authorityIds = input.authorityIds,
                    isEnabled = input.isEnabled,
                ),
                file = fileInput.file,
                fileArgumentPresent = fileInput.fileArgumentPresent,
            ).toGraphQL()
        }
}

internal data class FileInput(
    val fileArgumentPresent: Boolean,
    val file: MultipartFile?,
)

internal fun resolveFileInput(dfe: DataFetchingEnvironment): FileInput {
    val fileArgumentPresent = dfe.arguments.containsKey("file")
    val file = if (fileArgumentPresent && dfe.arguments["file"] != null) {
        dfe.getArgument<MultipartFile>("file")
    } else {
        null
    }

    return FileInput(
        fileArgumentPresent = fileArgumentPresent,
        file = file,
    )
}
