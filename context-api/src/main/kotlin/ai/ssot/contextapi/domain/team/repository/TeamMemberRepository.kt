package ai.ssot.contextapi.domain.team.repository

import ai.ssot.contextapi.domain.team.entity.TeamMember
import ai.ssot.contextapi.domain.team.entity.TeamMemberId
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param

interface TeamMemberRepository : JpaRepository<TeamMember, TeamMemberId> {
    fun findAllByIdMemberId(memberId: Long): List<TeamMember>

    fun findAllByIdTeamIdOrderByIdMemberIdAsc(teamId: Long): List<TeamMember>

    fun existsByIdTeamId(teamId: Long): Boolean

    fun existsByIdTeamIdAndIdMemberId(teamId: Long, memberId: Long): Boolean

    @Query(
        value = """
        select
            m.id as id,
            m.name as name,
            m.email as email,
            m.is_admin as admin,
            m.is_enabled as enabled,
            m.created_datetime as "createdDatetime"
        from team_member tm
        join members m on m.id = tm.member_id
        where tm.team_id = :teamId
        order by m.created_datetime desc, m.id desc
        """,
        countQuery = """
        select count(*)
        from team_member tm
        where tm.team_id = :teamId
        """,
        nativeQuery = true,
    )
    fun findMemberSummariesByTeamId(
        @Param("teamId") teamId: Long,
        pageable: Pageable,
    ): Page<TeamMemberSummaryProjection>
}
