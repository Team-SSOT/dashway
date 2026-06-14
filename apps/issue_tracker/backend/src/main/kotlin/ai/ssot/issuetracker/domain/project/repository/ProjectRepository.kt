package ai.ssot.issuetracker.domain.project.repository

import ai.ssot.issuetracker.domain.project.entity.Project
import ai.ssot.issuetracker.domain.project.entity.QProject.Companion.project
import ai.ssot.issuetracker.domain.project.entity.QProjectMember.Companion.projectMember
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

interface ProjectRepository : JpaRepository<Project, Long>, QProjectRepository {
    fun existsByKey(key: String): Boolean

    fun findByIdAndIsEnabledTrueAndIsDeletedFalse(id: Long): Project?
}

interface QProjectRepository {
    fun findJoinedProjects(memberId: Long, pageable: Pageable): Page<Project>
}

@Repository
class QProjectRepositoryImpl(
    private val queryFactory: JPAQueryFactory,
) : QProjectRepository {
    override fun findJoinedProjects(memberId: Long, pageable: Pageable): Page<Project> {
        val totalCount = queryFactory.select(project.count())
            .from(project)
            .innerJoin(projectMember).on(
                projectMember.id.projectId.eq(project.id)
                    .and(projectMember.id.memberId.eq(memberId)),
            )
            .where(
                project.isEnabled.isTrue,
                project.isDeleted.isFalse,
            )
            .fetchOne() ?: 0L

        if (totalCount == 0L) {
            return PageImpl(emptyList(), pageable, totalCount)
        }

        val projects = queryFactory.selectFrom(project)
            .innerJoin(projectMember).on(
                projectMember.id.projectId.eq(project.id)
                    .and(projectMember.id.memberId.eq(memberId)),
            )
            .where(
                project.isEnabled.isTrue,
                project.isDeleted.isFalse,
            )
            .orderBy(project.updatedDatetime.desc(), project.id.desc())
            .offset(pageable.offset)
            .limit(pageable.pageSize.toLong())
            .fetch()

        return PageImpl(projects, pageable, totalCount)
    }
}
