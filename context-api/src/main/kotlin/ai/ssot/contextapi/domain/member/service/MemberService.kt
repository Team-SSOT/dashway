package ai.ssot.contextapi.domain.member.service

import ai.ssot.contextapi.domain.auth.exception.ForbiddenException
import ai.ssot.contextapi.domain.auth.service.CurrentViewerService
import ai.ssot.contextapi.domain.member.dto.MemberDto
import ai.ssot.contextapi.domain.member.dto.UpdateMemberDto
import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.domain.member.exception.DuplicateMemberEmailException
import ai.ssot.contextapi.domain.member.exception.MemberNotFoundException
import ai.ssot.contextapi.domain.member.repository.MemberRepository
import ai.ssot.contextapi.shared.page.PageResult
import ai.ssot.contextapi.shared.page.PageSupport
import ai.ssot.contextapi.shared.validation.ValidationErrorCollector
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberService(
    private val memberRepository: MemberRepository,
    private val currentViewerService: CurrentViewerService,
) {
    @Transactional(readOnly = true)
    fun getMemberPageResult(page: Int, size: Int): PageResult<MemberDto> {
        val memberPage = memberRepository.findAll(PageSupport.pageRequest(page, size))
            .map { member ->
                MemberDto(
                    id = checkNotNull(member.id),
                    name = member.name,
                    email = member.email,
                    isAdmin = member.isAdmin,
                    isEnabled = member.isEnabled,
                    createdDatetime = member.createdDatetime,
                )
            }

        return PageResult(memberPage)
    }

    @Transactional(readOnly = true)
    fun getDtoById(id: Long): MemberDto {
        return getById(id).let {
                MemberDto(
                    id = it.id!!,
                    name = it.name,
                    email = it.email,
                    isAdmin = it.isAdmin,
                    isEnabled = it.isEnabled,
                    createdDatetime = it.createdDatetime,
                )
            }
    }

    @Transactional(readOnly = true)
    fun getById(id: Long): Member {
        return memberRepository.findById(id).orElseThrow { MemberNotFoundException(id) }
    }

    fun existsByEmail(email: String) = memberRepository.existsByEmail(email)

    @Transactional
    fun create(name: String, email: String, password: String, isAdmin: Boolean, isEnabled: Boolean): Member {
        return memberRepository.save(
            Member(
                name = name,
                email = email,
                password = password,
                isAdmin = isAdmin,
                isEnabled = isEnabled,
            )
        )
    }

    @Transactional
    fun updateMember(input: UpdateMemberDto): MemberDto {
        val memberId = input.id
        val viewer = currentViewerService.requireAdminOrSelf(memberId)
        val member = memberRepository.findById(memberId).orElseThrow { MemberNotFoundException(memberId) }
        val errors = ValidationErrorCollector()
        val name = input.name?.trim()
        val email = input.email?.trim()

        if (!viewer.admin && (input.isAdmin != null || input.isEnabled != null)) {
            throw ForbiddenException("Only admins can change member admin or enabled flags.")
        }

        name?.let { errors.requireNonBlankText("name", it) }
        email?.let {
            errors.requireNonBlankText("email", it)
            errors.addIf(it.isNotBlank() && memberRepository.existsByEmailAndIdNot(it, memberId)) {
                DuplicateMemberEmailException(it)
            }
        }
        errors.throwIfAny()

        name?.let { member.name = it }
        email?.let { member.email = it }
        input.isAdmin?.let { member.isAdmin = it }
        input.isEnabled?.let { member.isEnabled = it }

        val savedMember = memberRepository.save(member)
        return MemberDto(
            id = checkNotNull(savedMember.id),
            name = savedMember.name,
            email = savedMember.email,
            isAdmin = savedMember.isAdmin,
            isEnabled = savedMember.isEnabled,
            createdDatetime = savedMember.createdDatetime,
        )
    }
}
