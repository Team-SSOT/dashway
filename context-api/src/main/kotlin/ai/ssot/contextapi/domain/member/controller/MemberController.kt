package ai.ssot.contextapi.domain.member.controller

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

@DgsComponent
class MemberController(
    private val memberService: MemberService,
    private val memberRegistrationService: MemberRegistrationService
) {
    @DgsQuery
    fun members(
        @InputArgument page: Int,
        @InputArgument size: Int,
    ): MemberPage {
        return memberService.getMemberPageResult(page, size).let { (contents, pageInfo) ->
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

    @DgsQuery
    fun member(@InputArgument id: Long): Member? = memberService.getDtoById(id).toGraphQL()

    @DgsMutation
    fun registerMember(@InputArgument input: RegisterMemberInput): Member =
        memberRegistrationService.register(
            RegisterMemberDto(
                name = input.name,
                email = input.email,
                password = input.password,
                teamId = input.teamId,
                isEnabled = input.isEnabled,
                authorityIds = input.authorityIds
            )
        ).toGraphQL()


    @DgsMutation
    fun updateMember(@InputArgument input: UpdateMemberInput): Member =
        withOwnedOrAdmin(input.id) {
            memberService.updateMember(
                UpdateMemberDto(
                    id = input.id,
                    name = input.name,
                    email = input.email,
                    authorityIds = input.authorityIds,
                    isEnabled = input.isEnabled,
                )
            ).toGraphQL()
        }
}
