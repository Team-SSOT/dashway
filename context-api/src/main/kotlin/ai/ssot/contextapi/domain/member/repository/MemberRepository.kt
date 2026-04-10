package ai.ssot.contextapi.domain.member.repository

import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.domain.member.dto.MemberSearchDto
import ai.ssot.contextapi.domain.member.dto.MemberSearchResult
import ai.ssot.contextapi.domain.member.entity.QMember.Companion.member
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

interface MemberRepository : JpaRepository<Member, Long>, QMemberRepository {
    fun findByEmail(email: String): Member?

    fun existsByEmail(email: String): Boolean

    fun findByIdAndIsEnabled(id: Long, isEnabled: Boolean): Member?
}

interface QMemberRepository {
    fun search(query: String, pageable: Pageable): Page<Member>
}

@Repository
class QMemberRepositoryImpl(
    private val queryFactory: JPAQueryFactory,
) : QMemberRepository {
    override fun search(query: String, pageable: Pageable): Page<Member> {
        val predicate = member.isEnabled.isTrue.and(
            member.name.containsIgnoreCase(query)
                .or(member.email.containsIgnoreCase(query)),
        )

        val items = queryFactory.selectFrom(member)
            .where(predicate)
            .orderBy(member.createdDatetime.desc(), member.id.desc())
            .offset(pageable.offset)
            .limit(pageable.pageSize.toLong())
            .fetch()

        val totalCount = (queryFactory.select(member.count())
            .from(member)
            .where(predicate)
            .fetchOne() ?: 0L)

        return PageImpl(items, pageable, totalCount)
    }
}
