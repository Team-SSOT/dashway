package ai.ssot.contextapi.domain.auth.repository

import ai.ssot.contextapi.domain.auth.entity.Authority
import ai.ssot.contextapi.domain.auth.entity.MemberAuthority
import ai.ssot.contextapi.domain.auth.entity.MemberAuthorityId
import ai.ssot.contextapi.domain.auth.entity.QAuthority.Companion.authority
import ai.ssot.contextapi.domain.auth.entity.QMemberAuthority.Companion.memberAuthority
import com.querydsl.core.group.GroupBy.groupBy
import com.querydsl.core.group.GroupBy.list
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository


interface MemberAuthorityRepository : JpaRepository<MemberAuthority, MemberAuthorityId>, QMemberAuthorityRepository {
    fun deleteAllByIdMemberId(memberId: Long)
}

interface QMemberAuthorityRepository {
    fun getMemberIdToAuthorities(memberIds: List<Long>): Map<Long, List<Authority>>
}

@Repository
class QMemberAuthorityRepositoryImpl(
    private val queryFactory: JPAQueryFactory
): QMemberAuthorityRepository {
    override fun getMemberIdToAuthorities(memberIds: List<Long>): Map<Long, List<Authority>> {
        return queryFactory.from(memberAuthority)
            .join(memberAuthority.authority, authority)
            .where(memberAuthority.id.memberId.`in`(memberIds))
            .transform(groupBy(memberAuthority.id.memberId).`as`(list(authority)))
    }
}
