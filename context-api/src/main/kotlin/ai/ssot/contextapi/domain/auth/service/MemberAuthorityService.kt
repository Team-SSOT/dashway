package ai.ssot.contextapi.domain.auth.service

import ai.ssot.contextapi.domain.auth.entity.Authority
import ai.ssot.contextapi.domain.auth.entity.MemberAuthority
import ai.ssot.contextapi.domain.auth.entity.MemberAuthorityId
import ai.ssot.contextapi.domain.auth.exception.AuthorityEmptyException
import ai.ssot.contextapi.domain.auth.repository.MemberAuthorityRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MemberAuthorityService(
    private val authorityService: AuthorityService,
    private val memberAuthorityRepository: MemberAuthorityRepository
) {

    @Transactional
    fun create(memberId: Long, authorityIds: List<Int>): List<MemberAuthority> {
        return authorityService.getAllByIds(authorityIds)
            .map {
                MemberAuthority(
                    id = MemberAuthorityId(memberId, it.id!!),
                    authority = it
                )
            }.let {
                memberAuthorityRepository.saveAll(it)
            }
    }

    @Transactional
    fun update(memberId: Long, authorityIds: List<Int>): List<MemberAuthority> {
        if (authorityIds.isEmpty()) {
            throw AuthorityEmptyException()
        }

        memberAuthorityRepository.deleteAllByIdMemberId(memberId)

        return create(memberId, authorityIds)
    }

    fun getMemberIdToAuthorities(memberIds: List<Long>): Map<Long, List<Authority>> {
        return memberAuthorityRepository.getMemberIdToAuthorities(memberIds)
    }
}
