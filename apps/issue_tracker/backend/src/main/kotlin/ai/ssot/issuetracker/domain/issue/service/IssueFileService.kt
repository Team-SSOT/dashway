package ai.ssot.issuetracker.domain.issue.service

import ai.ssot.issuetracker.domain.issue.entity.CommentFile
import ai.ssot.issuetracker.domain.issue.entity.CommentFileId
import ai.ssot.issuetracker.domain.issue.entity.IssueFile
import ai.ssot.issuetracker.domain.issue.entity.IssueFileId
import ai.ssot.issuetracker.domain.issue.exception.InvalidIssueRequestException
import ai.ssot.issuetracker.domain.issue.repository.CommentFileRepository
import ai.ssot.issuetracker.domain.issue.repository.FileReferenceRepository
import ai.ssot.issuetracker.domain.issue.repository.IssueFileRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.util.UUID

@Service
class IssueFileService(
    private val fileReferenceRepository: FileReferenceRepository,
    private val issueFileRepository: IssueFileRepository,
    private val commentFileRepository: CommentFileRepository,
) {
    @Transactional
    fun replaceIssueFiles(issueId: Long, rawFileIds: Collection<String>) {
        val fileIds = parseAndValidateFileIds(rawFileIds)
        issueFileRepository.deleteAllByIdIssueId(issueId)
        issueFileRepository.saveAllAndFlush(
            fileIds.map { fileId ->
                IssueFile(
                    id = IssueFileId(issueId = issueId, fileId = fileId),
                    createdDatetime = OffsetDateTime.now(),
                )
            },
        )
    }

    @Transactional
    fun addIssueFiles(issueId: Long, rawFileIds: Collection<String>) {
        val fileIds = parseAndValidateFileIds(rawFileIds)
        val existingFileIds = issueFileRepository.findAllByIdIssueIdIn(listOf(issueId))
            .map { it.id.fileId }
            .toSet()
        issueFileRepository.saveAllAndFlush(
            fileIds.filterNot(existingFileIds::contains).map { fileId ->
                IssueFile(
                    id = IssueFileId(issueId = issueId, fileId = fileId),
                    createdDatetime = OffsetDateTime.now(),
                )
            },
        )
    }

    @Transactional
    fun removeIssueFile(issueId: Long, rawFileId: String) {
        val fileId = parseFileId(rawFileId)
        issueFileRepository.deleteByIdIssueIdAndIdFileId(issueId, fileId)
    }

    @Transactional
    fun replaceCommentFiles(commentId: Long, rawFileIds: Collection<String>) {
        val fileIds = parseAndValidateFileIds(rawFileIds)
        commentFileRepository.deleteAllByIdCommentId(commentId)
        commentFileRepository.saveAllAndFlush(
            fileIds.map { fileId ->
                CommentFile(
                    id = CommentFileId(commentId = commentId, fileId = fileId),
                    createdDatetime = OffsetDateTime.now(),
                )
            },
        )
    }

    @Transactional(readOnly = true)
    fun getIssueFileIdsByIssueIds(issueIds: Collection<Long>): Map<Long, List<UUID>> {
        if (issueIds.isEmpty()) {
            return emptyMap()
        }

        return issueFileRepository.findAllByIdIssueIdIn(issueIds)
            .groupBy({ it.id.issueId }, { it.id.fileId })
            .mapValues { (_, fileIds) -> fileIds.sortedBy { it.toString() } }
    }

    @Transactional(readOnly = true)
    fun getCommentFileIdsByCommentIds(commentIds: Collection<Long>): Map<Long, List<UUID>> {
        if (commentIds.isEmpty()) {
            return emptyMap()
        }

        return commentFileRepository.findAllByIdCommentIdIn(commentIds)
            .groupBy({ it.id.commentId }, { it.id.fileId })
            .mapValues { (_, fileIds) -> fileIds.sortedBy { it.toString() } }
    }

    private fun parseAndValidateFileIds(rawFileIds: Collection<String>): List<UUID> {
        val fileIds = rawFileIds.map(::parseFileId)
        if (fileIds.distinct().size != fileIds.size) {
            throw InvalidIssueRequestException("fileIds must not contain duplicates.")
        }

        val existingCount = fileReferenceRepository.countExisting(fileIds)
        if (existingCount != fileIds.size.toLong()) {
            throw InvalidIssueRequestException("One or more files were not found.")
        }
        return fileIds
    }

    private fun parseFileId(rawFileId: String): UUID =
        try {
            UUID.fromString(rawFileId)
        } catch (exception: IllegalArgumentException) {
            throw InvalidIssueRequestException("fileId must be a UUID.")
        }
}
