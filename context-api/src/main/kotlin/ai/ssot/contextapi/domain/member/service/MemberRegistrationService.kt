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
import org.springframework.web.multipart.MultipartFile

@Service
class MemberRegistrationService(
    private val memberService: MemberService,
    private val teamMemberService: TeamMemberService,
    private val memberAuthorityService: MemberAuthorityService,
    private val passwordEncoder: PasswordEncoder,
    private val memberProfileImageService: MemberProfileImageService,
) {

    @Transactional
    fun register(
        input: RegisterMemberDto,
        file: MultipartFile?,
    ): MemberDto {
        checkEmailNotDuplicated(input.email)
        var savedProfilePath: String? = null

        try {
            val member = memberService.create(
                name = input.name,
                email = input.email,
                password = requireNotNull(passwordEncoder.encode(input.password)),
                isEnabled = input.isEnabled,
            )

            if (file != null) {
                savedProfilePath = memberProfileImageService.store(member.id!!, file)
                member.profileImgPath = savedProfilePath
            }

            input.teamId?.also {
                teamMemberService.addMember(it, member.id!!)
            }

            (input.authorityIds
                ?.also { verifyIsAdmin() }
                ?: listOf(3))
                .apply {
                memberAuthorityService.create(member.id!!, this)
            }

            return memberService.getDtoById(checkNotNull(member.id))
        } catch (exception: Exception) {
            savedProfilePath?.let {
                memberProfileImageService.cleanupQuietly(it, "cleanup failed registration image")
            }
            throw exception
        }
    }

    private fun checkEmailNotDuplicated(email: String) {
        if (memberService.existsByEmail(email)) {
            throw DuplicateMemberEmailException(email)
        }
    }
}
