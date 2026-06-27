package ai.ssot.issuetracker.domain.issue.repository

import ai.ssot.issuetracker.domain.issue.entity.IssueComment
import org.springframework.data.jpa.repository.JpaRepository

interface IssueCommentRepository : JpaRepository<IssueComment, Long> {
    fun findByIdAndIsEnabledTrue(id: Long): IssueComment?

    fun findAllByIssueIdInAndIsEnabledTrueOrderByCreatedDatetimeAscIdAsc(issueIds: Collection<Long>): List<IssueComment>
}
