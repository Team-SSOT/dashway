package ai.ssot.contextapi.domain.member.service

import ai.ssot.contextapi.domain.auth.service.MemberAuthorityService
import ai.ssot.contextapi.domain.auth.service.checkIsAdmin
import ai.ssot.contextapi.domain.member.dto.MemberDto
import ai.ssot.contextapi.domain.member.dto.UpdateMemberDto
import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.domain.member.exception.MemberNotFoundException
import ai.ssot.contextapi.domain.member.repository.MemberRepository
import ai.ssot.contextapi.shared.page.PageInfo
import ai.ssot.contextapi.shared.page.PageResult
import ai.ssot.contextapi.shared.page.PageSupport
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberService(
    private val memberAuthorityService: MemberAuthorityService,
    private val memberRepository: MemberRepository,
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
    fun getById(id: Long): Member {
        return memberRepository.findById(id).orElseThrow { MemberNotFoundException(id) }
    }

    @Transactional(readOnly = true)
    fun getDtosByIds(ids: List<Long>): List<MemberDto> {
        if (ids.isEmpty()) {
            return emptyList()
        }
        return memberRepository.findAllById(ids).map { MemberDto(it) }
    }

    @Transactional(readOnly = true)
    fun findByEmail(email: String): Member? = memberRepository.findByEmail(email)

    fun existsByEmail(email: String): Boolean = memberRepository.existsByEmail(email)

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
    fun updateMember(input: UpdateMemberDto): MemberDto {
        val member = getById(input.id)

        input.name?.apply { member.name = this }
        input.isEnabled?.apply {
            checkIsAdmin()
            member.isEnabled = this
        }
        input.authorities?.apply {
            checkIsAdmin()
            memberAuthorityService.update(member.id!!, input.authorities.map { it.id })
        }

        return MemberDto(
            memberRepository.save(member)
        )
    }
}
