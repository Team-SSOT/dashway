package ai.ssot.contextapi.domain.auth.repository

import ai.ssot.contextapi.domain.auth.entity.Authority
import ai.ssot.contextapi.domain.auth.entity.QAuthority.Companion.authority
import ai.ssot.contextapi.domain.auth.entity.QMemberAuthority.Companion.memberAuthority
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

interface AuthorityRepository : JpaRepository<Authority, Int>, QAuthorityRepository {
}

interface QAuthorityRepository {
    fun findAllByMemberId(memberId: Long): List<Authority>
}


@Repository
class QAuthorityRepositoryImpl(private val queryFactory: JPAQueryFactory): QAuthorityRepository {
    override fun findAllByMemberId(memberId: Long): List<Authority> {
        return queryFactory.select(authority)
            .from(memberAuthority)
            .join(memberAuthority.authority, authority)
            .where(memberAuthority.id.memberId.eq(memberId))
            .fetch()
    }
}
