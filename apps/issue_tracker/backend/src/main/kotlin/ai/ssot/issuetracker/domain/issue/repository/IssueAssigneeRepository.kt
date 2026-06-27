package ai.ssot.issuetracker.domain.issue.repository

import ai.ssot.issuetracker.domain.issue.entity.IssueAssignee
import ai.ssot.issuetracker.domain.issue.entity.IssueAssigneeId
import org.springframework.data.jpa.repository.JpaRepository

interface IssueAssigneeRepository : JpaRepository<IssueAssignee, IssueAssigneeId> {
    fun findAllByIdIssueIdIn(issueIds: Collection<Long>): List<IssueAssignee>

    fun deleteAllByIdIssueId(issueId: Long)
}
