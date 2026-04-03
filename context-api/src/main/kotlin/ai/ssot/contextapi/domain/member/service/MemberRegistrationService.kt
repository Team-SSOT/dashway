package ai.ssot.contextapi.domain.member.service

import ai.ssot.contextapi.domain.auth.service.MemberAuthorityService
import ai.ssot.contextapi.domain.auth.service.verifyIsAdmin
import ai.ssot.contextapi.domain.member.dto.MemberDto
import ai.ssot.contextapi.domain.member.dto.RegisterMemberDto
import ai.ssot.contextapi.domain.member.exception.DuplicateMemberEmailException
import ai.ssot.contextapi.domain.team.service.TeamMemberService
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberRegistrationService(
    private val memberService: MemberService,
    private val teamMemberService: TeamMemberService,
    private val memberAuthorityService: MemberAuthorityService,
    private val passwordEncoder: PasswordEncoder
) {

    @Transactional
    fun register(input: RegisterMemberDto): MemberDto {
        checkEmailNotDuplicated(input.email)

        val member = memberService.create(
            name = input.name,
            email = input.email,
            password = requireNotNull(passwordEncoder.encode(input.password)),
            isEnabled = input.isEnabled,
        )
        input.teamId?.also {
            teamMemberService.addMember(it, member.id!!)
        }

        input.authorityIds
            ?.also { verifyIsAdmin() }
            ?:let { listOf(3) }
            .apply {
                memberAuthorityService.create(member.id!!, this)
            }


        return memberService.getDtoById(checkNotNull(member.id))
    }

    private fun checkEmailNotDuplicated(email: String) {
        if(memberService.existsByEmail(email)) {
            throw DuplicateMemberEmailException(email)
        }
    }
}
