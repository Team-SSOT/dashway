package ai.ssot.issuetracker.domain.issue.repository

import ai.ssot.issuetracker.domain.issue.dto.IssueBaseDto
import ai.ssot.issuetracker.domain.issue.dto.IssueSearchDto
import ai.ssot.issuetracker.domain.issue.dto.toBaseDto
import ai.ssot.issuetracker.domain.issue.entity.Issue
import ai.ssot.issuetracker.domain.issue.entity.QIssue.Companion.issue
import ai.ssot.issuetracker.domain.issue.entity.QIssueAssignee.Companion.issueAssignee
import ai.ssot.issuetracker.domain.issue.entity.QIssueLabel.Companion.issueLabel
import ai.ssot.issuetracker.domain.project.entity.QProject.Companion.project
import ai.ssot.issuetracker.domain.project.entity.QProjectMember.Companion.projectMember
import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.JPAExpressions
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

interface IssueRepository : JpaRepository<Issue, Long>, QIssueRepository {
    fun findByIdAndIsEnabledTrueAndIsDeletedFalse(id: Long): Issue?

    fun existsByProjectIdAndIsEnabledTrueAndIsDeletedFalse(projectId: Long): Boolean
}

interface QIssueRepository {
    fun findIssueForMember(memberId: Long, issueId: Long): IssueBaseDto?

    fun findIssuesForMember(memberId: Long, dto: IssueSearchDto, pageable: Pageable): Page<IssueBaseDto>
}

@Repository
class QIssueRepositoryImpl(
    private val queryFactory: JPAQueryFactory,
) : QIssueRepository {
    override fun findIssueForMember(memberId: Long, issueId: Long): IssueBaseDto? =
        queryFactory.select(issue, project.key)
            .from(issue)
            .innerJoin(project).on(project.id.eq(issue.projectId))
            .innerJoin(projectMember).on(
                projectMember.id.projectId.eq(issue.projectId)
                    .and(projectMember.id.memberId.eq(memberId)),
            )
            .where(
                issue.id.eq(issueId),
                activeIssuePredicate(),
                activeProjectPredicate(),
            )
            .fetchOne()
            ?.let { row ->
                requireNotNull(row.get(issue)).toBaseDto(
                    projectKey = requireNotNull(row.get(project.key)),
                )
            }

    override fun findIssuesForMember(memberId: Long, dto: IssueSearchDto, pageable: Pageable): Page<IssueBaseDto> {
        val predicates = searchPredicates(dto)
        val totalCount = queryFactory.select(issue.count())
            .from(issue)
            .innerJoin(project).on(project.id.eq(issue.projectId))
            .innerJoin(projectMember).on(
                projectMember.id.projectId.eq(issue.projectId)
                    .and(projectMember.id.memberId.eq(memberId)),
            )
            .where(*predicates)
            .fetchOne() ?: 0L

        if (totalCount == 0L) {
            return PageImpl(emptyList(), pageable, totalCount)
        }

        val issues = queryFactory.select(issue, project.key)
            .from(issue)
            .innerJoin(project).on(project.id.eq(issue.projectId))
            .innerJoin(projectMember).on(
                projectMember.id.projectId.eq(issue.projectId)
                    .and(projectMember.id.memberId.eq(memberId)),
            )
            .where(*predicates)
            .orderBy(issue.updatedDatetime.desc(), issue.id.desc())
            .offset(pageable.offset)
            .limit(pageable.pageSize.toLong())
            .fetch()
            .map { row ->
                requireNotNull(row.get(issue)).toBaseDto(
                    projectKey = requireNotNull(row.get(project.key)),
                )
            }

        return PageImpl(issues, pageable, totalCount)
    }

    private fun searchPredicates(dto: IssueSearchDto): Array<BooleanExpression> {
        val predicates = mutableListOf(
            activeIssuePredicate(),
            activeProjectPredicate(),
        )

        if (dto.projectIds.isNotEmpty()) {
            predicates += issue.projectId.`in`(dto.projectIds)
        }
        if (dto.statuses.isNotEmpty()) {
            predicates += issue.status.`in`(dto.statuses)
        }
        if (dto.priorities.isNotEmpty()) {
            predicates += issue.priority.`in`(dto.priorities)
        }
        dto.dueFrom?.let { predicates += issue.dueDatetime.goe(it) }
        dto.dueTo?.let { predicates += issue.dueDatetime.loe(it) }
        dto.query?.trim()?.takeIf { it.isNotEmpty() }?.let { query ->
            predicates += issue.title.containsIgnoreCase(query)
                .or(issue.content.containsIgnoreCase(query))
        }
        if (dto.assigneeMemberIds.isNotEmpty()) {
            predicates += issue.id.`in`(
                JPAExpressions.select(issueAssignee.id.issueId)
                    .from(issueAssignee)
                    .where(issueAssignee.id.memberId.`in`(dto.assigneeMemberIds)),
            )
        }
        if (dto.labelIds.isNotEmpty()) {
            predicates += issue.id.`in`(
                JPAExpressions.select(issueLabel.id.issueId)
                    .from(issueLabel)
                    .where(issueLabel.id.labelId.`in`(dto.labelIds)),
            )
        }

        return predicates.toTypedArray()
    }

    private fun activeIssuePredicate(): BooleanExpression =
        issue.isEnabled.isTrue.and(issue.isDeleted.isFalse)

    private fun activeProjectPredicate(): BooleanExpression =
        project.isEnabled.isTrue.and(project.isDeleted.isFalse)
}
