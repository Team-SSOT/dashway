package ai.ssot.issuetracker.domain.issue.repository

import ai.ssot.issuetracker.domain.issue.entity.IssueFile
import ai.ssot.issuetracker.domain.issue.entity.IssueFileId
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface IssueFileRepository : JpaRepository<IssueFile, IssueFileId> {
    fun findAllByIdIssueIdIn(issueIds: Collection<Long>): List<IssueFile>

    fun deleteAllByIdIssueId(issueId: Long)

    fun deleteByIdIssueIdAndIdFileId(issueId: Long, fileId: UUID)
}
