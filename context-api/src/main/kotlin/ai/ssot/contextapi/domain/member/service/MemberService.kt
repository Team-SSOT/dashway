package ai.ssot.contextapi.domain.member.service

import ai.ssot.contextapi.domain.auth.exception.ForbiddenException
import ai.ssot.contextapi.domain.auth.service.CurrentViewerService
import ai.ssot.contextapi.domain.member.dto.MemberDto
import ai.ssot.contextapi.domain.member.dto.MemberPage
import ai.ssot.contextapi.domain.member.dto.RegisterMemberInput
import ai.ssot.contextapi.domain.member.dto.UpdateMemberInput
import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.domain.member.exception.DuplicateMemberEmailException
import ai.ssot.contextapi.domain.member.exception.MemberNotFoundException
import ai.ssot.contextapi.domain.member.repository.MemberRepository
import ai.ssot.contextapi.shared.page.PageInfo
import ai.ssot.contextapi.shared.page.PageSupport
import ai.ssot.contextapi.shared.validation.ValidationErrorCollector
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberService(
    private val memberRepository: MemberRepository,
    private val currentViewerService: CurrentViewerService,
    private val passwordEncoder: PasswordEncoder,
) {
    @Transactional(readOnly = true)
    fun members(page: Int, size: Int): MemberPage {
        currentViewerService.requireAdmin()
        val memberPage = memberRepository.findAll(PageSupport.pageRequest(page, size))
        return MemberPage(
            items = memberPage.content.map { member ->
                MemberDto(
                    id = checkNotNull(member.id),
                    name = member.name,
                    email = member.email,
                    admin = member.admin,
                    enabled = member.enabled,
                    createdDatetime = member.createdDatetime,
                )
            },
            pageInfo = PageInfo(
                page = memberPage.number,
                size = memberPage.size,
                totalElements = memberPage.totalElements.toInt(),
                totalPages = memberPage.totalPages,
            ),
        )
    }

    @Transactional(readOnly = true)
    fun member(id: Long): MemberDto? {
        currentViewerService.requireAdminOrSelf(id)
        val member = memberRepository.findById(id).orElse(null) ?: return null
        return MemberDto(
            id = checkNotNull(member.id),
            name = member.name,
            email = member.email,
            admin = member.admin,
            enabled = member.enabled,
            createdDatetime = member.createdDatetime,
        )
    }

    @Transactional
    fun registerMember(input: RegisterMemberInput): MemberDto {
        val name = input.name.trim()
        val email = input.email.trim()
        val bootstrapRegistration = memberRepository.count() == 0L
        val errors = ValidationErrorCollector()

        if (!bootstrapRegistration) {
            currentViewerService.requireAdmin()
        }

        errors.requireNonBlankText("name", name)
        errors.requireNonBlankText("email", email)
        errors.requireNonBlankText("password", input.password)
        errors.addIf(email.isNotBlank() && memberRepository.existsByEmail(email)) {
            DuplicateMemberEmailException(email)
        }
        errors.throwIfAny()

        val savedMember = memberRepository.save(
            Member(
                name = name,
                email = email,
                passwordHash = passwordEncoder.encode(input.password),
                admin = if (bootstrapRegistration) true else (input.admin ?: false),
                enabled = input.enabled ?: true,
            ),
        )
        return MemberDto(
            id = checkNotNull(savedMember.id),
            name = savedMember.name,
            email = savedMember.email,
            admin = savedMember.admin,
            enabled = savedMember.enabled,
            createdDatetime = savedMember.createdDatetime,
        )
    }

    @Transactional
    fun updateMember(input: UpdateMemberInput): MemberDto {
        val memberId = input.id
        val viewer = currentViewerService.requireAdminOrSelf(memberId)
        val member = memberRepository.findById(memberId).orElseThrow { MemberNotFoundException(memberId) }
        val errors = ValidationErrorCollector()
        val name = input.name?.trim()
        val email = input.email?.trim()

        if (!viewer.admin && (input.admin != null || input.enabled != null)) {
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
        input.admin?.let { member.admin = it }
        input.enabled?.let { member.enabled = it }

        val savedMember = memberRepository.save(member)
        return MemberDto(
            id = checkNotNull(savedMember.id),
            name = savedMember.name,
            email = savedMember.email,
            admin = savedMember.admin,
            enabled = savedMember.enabled,
            createdDatetime = savedMember.createdDatetime,
        )
    }
}
