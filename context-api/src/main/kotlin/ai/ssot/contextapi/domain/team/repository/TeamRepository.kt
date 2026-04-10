package ai.ssot.contextapi.domain.team.repository

import ai.ssot.contextapi.domain.team.entity.Team
import ai.ssot.contextapi.domain.team.entity.QTeam.Companion.team
import ai.ssot.contextapi.domain.team.dto.TeamSearchDto
import ai.ssot.contextapi.domain.team.dto.TeamSearchResult
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

interface TeamRepository : JpaRepository<Team, Long>, QTeamRepository

interface QTeamRepository {
    fun search(query: String, pageable: Pageable): Page<Team>
}

@Repository
class QTeamRepositoryImpl(
    private val queryFactory: JPAQueryFactory,
) : QTeamRepository {
    override fun search(query: String, pageable: Pageable): Page<Team> {
        val predicate = team.name.containsIgnoreCase(query)
        val totalCount = (queryFactory.select(team.count())
            .from(team)
            .where(predicate)
            .fetchOne() ?: 0L).toInt()

        val items = queryFactory.selectFrom(team)
            .where(predicate)
            .orderBy(team.createdDatetime.desc(), team.id.desc())
            .offset(pageable.offset)
            .limit(pageable.pageSize.toLong())
            .fetch()

        return PageImpl(items, pageable, totalCount.toLong())
    }
}
