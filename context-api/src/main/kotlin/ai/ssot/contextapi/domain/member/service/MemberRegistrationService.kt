package ai.ssot.contextapi.domain.member.service

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
    private val passwordEncoder: PasswordEncoder
) {

    @Transactional
    fun register(input: RegisterMemberDto): MemberDto {
        val name = input.name.trim()
        val email = input.email.trim()
        checkEmailNotDuplicated(email)

        val member = memberService.create(
            name = name,
            email = email,
            password = requireNotNull(passwordEncoder.encode(input.password)),
            isAdmin = input.isAdmin ?: false,
            isEnabled = input.isEnabled ?: true,
        )

        teamMemberService.addMember(input.teamId, member.id!!)


        return MemberDto(
            id = checkNotNull(member.id),
            name = member.name,
            email = member.email,
            isAdmin = member.isAdmin,
            isEnabled = member.isEnabled,
            createdDatetime = member.createdDatetime,
        )
    }

    private fun checkEmailNotDuplicated(email: String) {
        if(memberService.existsByEmail(email)) {
            throw DuplicateMemberEmailException(email)
        }
    }
}