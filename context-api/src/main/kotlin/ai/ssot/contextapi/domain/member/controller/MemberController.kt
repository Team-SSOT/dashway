package ai.ssot.contextapi.domain.member.controller

import ai.ssot.contextapi.domain.member.dto.MemberDto
import ai.ssot.contextapi.domain.member.dto.MemberPage
import ai.ssot.contextapi.domain.member.dto.RegisterMemberInput
import ai.ssot.contextapi.domain.member.dto.UpdateMemberInput
import ai.ssot.contextapi.domain.member.service.MemberService
import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsMutation
import com.netflix.graphql.dgs.DgsQuery
import com.netflix.graphql.dgs.InputArgument

@DgsComponent
class MemberController(
    private val memberService: MemberService,
) {
    @DgsQuery
    fun members(
        @InputArgument page: Int,
        @InputArgument size: Int,
    ): MemberPage = memberService.members(page, size)

    @DgsQuery
    fun member(@InputArgument id: Long): MemberDto? = memberService.member(id)

    @DgsMutation
    fun registerMember(@InputArgument input: RegisterMemberInput): MemberDto = memberService.registerMember(input)

    @DgsMutation
    fun updateMember(@InputArgument input: UpdateMemberInput): MemberDto = memberService.updateMember(input)
}
