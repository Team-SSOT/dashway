package ai.ssot.contextapi.domain.member.controller

import ai.ssot.contextapi.domain.member.dto.MemberPage
import ai.ssot.contextapi.domain.member.dto.MemberView
import ai.ssot.contextapi.domain.member.dto.RegisterMemberInput
import ai.ssot.contextapi.domain.member.dto.RegisterMemberPayload
import ai.ssot.contextapi.domain.member.dto.UpdateMemberInput
import ai.ssot.contextapi.domain.member.dto.UpdateMemberPayload
import ai.ssot.contextapi.domain.member.service.MemberService
import ai.ssot.contextapi.shared.graphql.executeMutation
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
    fun member(@InputArgument id: Long): MemberView? = memberService.member(id)

    @DgsMutation
    fun registerMember(@InputArgument input: RegisterMemberInput): RegisterMemberPayload =
        executeMutation(
            action = { memberService.registerMember(input) },
            onError = { RegisterMemberPayload(errors = it) },
        )

    @DgsMutation
    fun updateMember(@InputArgument input: UpdateMemberInput): UpdateMemberPayload =
        executeMutation(
            action = { memberService.updateMember(input) },
            onError = { UpdateMemberPayload(errors = it) },
        )
}
