package ai.ssot.issuetracker.domain.issue.repository

import ai.ssot.issuetracker.domain.issue.entity.IssueLabel
import ai.ssot.issuetracker.domain.issue.entity.IssueLabelId
import org.springframework.data.jpa.repository.JpaRepository

interface IssueLabelRepository : JpaRepository<IssueLabel, IssueLabelId> {
    fun findAllByIdIssueIdIn(issueIds: Collection<Long>): List<IssueLabel>

    fun deleteAllByIdIssueId(issueId: Long)

    fun deleteAllByIdLabelId(labelId: Long)
}
