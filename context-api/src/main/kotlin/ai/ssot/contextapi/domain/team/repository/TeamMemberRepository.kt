package ai.ssot.contextapi.domain.team.repository

import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.domain.member.entity.QMember.Companion.member
import ai.ssot.contextapi.domain.team.entity.QTeamMember.Companion.teamMember
import ai.ssot.contextapi.domain.team.entity.TeamMember
import ai.ssot.contextapi.domain.team.entity.TeamMemberId
import com.querydsl.core.group.GroupBy.groupBy
import com.querydsl.core.group.GroupBy.list
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

interface TeamMemberRepository : JpaRepository<TeamMember, TeamMemberId>, QTeamMemberRepository {
    fun findAllByIdMemberId(memberId: Long): List<TeamMember>

    fun existsByIdTeamId(teamId: Long): Boolean

    fun existsByIdTeamIdAndIdMemberId(teamId: Long, memberId: Long): Boolean
}

interface QTeamMemberRepository {
    fun getTeamIdToMembers(teamIds: List<Long>): Map<Long, List<Member>>
}

@Repository
class QTeamMemberRepositoryImpl(private val queryFactory: JPAQueryFactory): QTeamMemberRepository {
    override fun getTeamIdToMembers(teamIds: List<Long>): Map<Long, List<Member>> {
        return queryFactory.from(teamMember)
            .join(member).on(teamMember.id.memberId.eq(member.id))
            .where(
                teamMember.id.teamId.`in`(teamIds),
                member.isEnabled.isTrue
            ).transform(groupBy(teamMember.id.teamId).`as`(list(member)))
    }
}

