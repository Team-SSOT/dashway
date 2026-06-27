package ai.ssot.issuetracker.domain.project.repository

import ai.ssot.issuetracker.domain.project.entity.ProjectMember
import ai.ssot.issuetracker.domain.project.entity.ProjectMemberId
import ai.ssot.issuetracker.domain.project.entity.ProjectRole
import ai.ssot.issuetracker.domain.project.entity.QProjectMember.Companion.projectMember
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

interface ProjectMemberRepository :
    JpaRepository<ProjectMember, ProjectMemberId>,
    QProjectMemberRepository {
    fun existsByIdProjectIdAndIdMemberId(projectId: Long, memberId: Long): Boolean

    fun findByIdProjectIdAndIdMemberId(projectId: Long, memberId: Long): ProjectMember?

    fun findAllByIdProjectIdAndIdMemberIdIn(projectId: Long, memberIds: Collection<Long>): List<ProjectMember>

    fun countByIdProjectIdAndRole(projectId: Long, role: ProjectRole): Long

    fun deleteByIdProjectIdAndIdMemberId(projectId: Long, memberId: Long)
}

interface QProjectMemberRepository {
    fun countMembersByProjectIds(projectIds: Collection<Long>): Map<Long, Long>
}

@Repository
class QProjectMemberRepositoryImpl(
    private val queryFactory: JPAQueryFactory,
) : QProjectMemberRepository {
    override fun countMembersByProjectIds(projectIds: Collection<Long>): Map<Long, Long> {
        if (projectIds.isEmpty()) {
            return emptyMap()
        }

        val memberCount = projectMember.id.memberId.count()

        return queryFactory.select(projectMember.id.projectId, memberCount)
            .from(projectMember)
            .where(projectMember.id.projectId.`in`(projectIds))
            .groupBy(projectMember.id.projectId)
            .fetch()
            .associate { row ->
                requireNotNull(row.get(projectMember.id.projectId)) to
                    requireNotNull(row.get(memberCount))
            }
    }
}
