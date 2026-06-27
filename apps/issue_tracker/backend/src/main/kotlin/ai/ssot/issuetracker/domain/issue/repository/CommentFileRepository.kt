package ai.ssot.issuetracker.domain.issue.repository

import ai.ssot.issuetracker.domain.issue.entity.CommentFile
import ai.ssot.issuetracker.domain.issue.entity.CommentFileId
import org.springframework.data.jpa.repository.JpaRepository

interface CommentFileRepository : JpaRepository<CommentFile, CommentFileId> {
    fun findAllByIdCommentIdIn(commentIds: Collection<Long>): List<CommentFile>

    fun deleteAllByIdCommentId(commentId: Long)
}
