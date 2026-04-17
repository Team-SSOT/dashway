package ai.ssot.contextapi.domain.member.service

import ai.ssot.contextapi.domain.auth.exception.ForbiddenException
import ai.ssot.contextapi.domain.auth.service.MemberAuthorityService
import ai.ssot.contextapi.domain.auth.service.checkIsAdmin
import ai.ssot.contextapi.domain.member.dto.MemberDto
import ai.ssot.contextapi.domain.member.dto.UpdateMemberDto
import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.domain.member.exception.MemberNotFoundException
import ai.ssot.contextapi.domain.member.repository.MemberRepository
import ai.ssot.contextapi.shared.StoredFile
import ai.ssot.contextapi.shared.page.PageInfo
import ai.ssot.contextapi.shared.page.PageResult
import ai.ssot.contextapi.shared.page.PageSupport
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile

@Service
class MemberService(
    private val memberAuthorityService: MemberAuthorityService,
    private val memberRepository: MemberRepository,
    private val memberProfileImageService: MemberProfileImageService,
    private val eventPublisher: ApplicationEventPublisher,
) {
    @Transactional(readOnly = true)
    fun getMemberPageResult(page: Int, size: Int): PageResult<MemberDto> {
        val memberPage = memberRepository.findAll(PageSupport.pageRequest(page, size))
        return PageResult(
            contents = memberPage.content.map { MemberDto(it) },
            pageInfo = PageInfo(
                totalCount = memberPage.totalElements,
                totalPages = memberPage.totalPages,
                pageable = memberPage.pageable,
            ),
        )
    }

    @Transactional(readOnly = true)
    fun getDtoById(id: Long): MemberDto {
        return MemberDto(getById(id))
    }

    @Transactional(readOnly = true)
    fun getProfileImage(
        memberId: Long,
        fileName: String,
    ): StoredFile? {
        return getEnabledMember(memberId)
            .takeIf { it.profileImgPath == "members/$memberId/profile/$fileName" }
            ?.let {
                memberProfileImageService.load(it.profileImgPath)
            }
    }

    @Transactional(readOnly = true)
    fun getById(id: Long): Member {
        return memberRepository.findById(id).orElseThrow { MemberNotFoundException(id) }
    }

    @Transactional(readOnly = true)
    fun getEnabledMember(id: Long): Member {
        return memberRepository.findByIdAndIsEnabled(id, true)
            ?:run { throw MemberNotFoundException(id) }
    }

    @Transactional(readOnly = true)
    fun findByEmail(email: String): Member? = memberRepository.findByEmail(email)

    fun existsByEmail(email: String): Boolean = memberRepository.existsByEmail(email)

    @Transactional(readOnly = true)
    fun search(query: String, pageable: Pageable): Page<Member> =
        memberRepository.search(query, pageable)

    @Transactional
    fun create(
        name: String,
        email: String,
        password: String,
        isEnabled: Boolean,
    ): Member {
        val savedMember = memberRepository.save(
            Member(
                name = name,
                email = email,
                password = password,
                isEnabled = isEnabled,
            ),
        )
        return savedMember
    }

    @Transactional
    fun updateMember(
        input: UpdateMemberDto,
        file: MultipartFile?,
        fileArgumentPresent: Boolean,
    ): MemberDto {
        val member = getById(input.id).also { member ->
            if (input.isEnabled != null || input.authorityIds != null) {
                requireAdmin()
            }
            input.name?.let { member.name = it }
            input.isEnabled?.let { member.isEnabled = it }
            input.authorityIds?.let { authorityIds ->
                memberAuthorityService.update(requireNotNull(member.id), authorityIds)
            }
        }

        if (!fileArgumentPresent) {
            return MemberDto(memberRepository.save(member))
        }

        var newPath: String? = null
        return try {
            val currentPath = member.profileImgPath
            newPath = file?.let{
                memberProfileImageService.store(requireNotNull(member.id), file)
            }
            member.profileImgPath = newPath
            val savedMember = memberRepository.save(member)
            currentPath?.let { eventPublisher.publishEvent(MemberProfileImageDeletedEvent(it)) }
            MemberDto(savedMember)
        } catch (exception: Exception) {
            if(newPath != null) {
                eventPublisher.publishEvent(MemberProfileImageDeletedEvent(newPath))
            }
            throw exception
        }
    }

    private fun requireAdmin() {
        if (!checkIsAdmin()) {
            throw ForbiddenException()
        }
    }
}
