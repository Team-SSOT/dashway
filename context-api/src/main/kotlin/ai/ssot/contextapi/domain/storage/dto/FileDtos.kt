package ai.ssot.contextapi.domain.storage.dto

import ai.ssot.contextapi.domain.storage.entity.File
import ai.ssot.contextapi.shared.page.PageInfo
import java.time.LocalDateTime
import java.util.*

data class FileResponse(
    val id: String,
    val path: String,
    val fileName: String,
    val contentType: String,
    val contentLength: Long,
    val ownerMemberId: Long,
    val checksumSha256: String,
    val createdDatetime: LocalDateTime,
)

data class FilePageResponse(
    val objects: List<FileResponse>,
    val pageInfo: PageInfo,
)

fun File.toResponse(): FileResponse =
    FileResponse(
        id = id.toString(),
        path = filePath(id),
        fileName = fileName,
        contentType = contentType,
        contentLength = contentLength,
        ownerMemberId = ownerMemberId,
        checksumSha256 = checksumSha256,
        createdDatetime = createdDatetime,
    )

fun filePath(id: UUID): String = "/files/$id"
