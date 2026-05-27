package ai.ssot.contextapi.domain.storage.service

import ai.ssot.contextapi.domain.storage.dto.FilePageResponse
import ai.ssot.contextapi.domain.storage.dto.FileResponse
import ai.ssot.contextapi.domain.storage.dto.toResponse
import ai.ssot.contextapi.domain.storage.entity.File
import ai.ssot.contextapi.domain.storage.exception.*
import ai.ssot.contextapi.domain.storage.repository.FileRepository
import ai.ssot.contextapi.shared.page.PageInfo
import ai.ssot.contextapi.shared.page.PageSupport
import org.springframework.context.ApplicationEventPublisher
import org.springframework.data.domain.Page
import org.springframework.http.MediaType
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.io.UncheckedIOException
import java.nio.file.NoSuchFileException
import java.nio.file.Path
import java.time.LocalDateTime
import java.util.*

data class FileDownload(
    val file: File,
    val storedObjectResource: StoredObjectResource,
)

@Service
class FileService(
    private val fileRepository: FileRepository,
    private val objectStorage: ObjectStorage,
    private val eventPublisher: ApplicationEventPublisher,
) {
    fun upload(file: MultipartFile): FileResponse {
        val memberId = requireAuthenticatedMemberId()
        val fileId = UUID.randomUUID()
        val storagePath = buildStoragePath(fileId)
        val fileName = resolveFileName(file.originalFilename)
        val contentType = resolveContentType(file.contentType)

        val storedObject = try {
            objectStorage.save(storagePath, file.inputStream)
        } catch (exception: Exception) {
            throw FileStorageException()
        }

        val now = LocalDateTime.now()
        return try {
            fileRepository.save(
                File(
                    id = fileId,
                    fileName = fileName,
                    storagePath = storagePath,
                    ownerMemberId = memberId,
                    contentType = contentType,
                    contentLength = storedObject.contentLength,
                    checksumSha256 = storedObject.checksumSha256,
                    createdDatetime = now,
                ),
            ).toResponse()
        } catch (exception: RuntimeException) {
            cleanupNewObject(storagePath)
            throw exception
        }
    }

    @Transactional(readOnly = true)
    fun download(id: String): FileDownload {
        val file = getById(id)
        requireAuthenticatedMemberId()
        val storedObjectResource = try {
            objectStorage.load(file.storagePath)
        } catch (exception: UncheckedIOException) {
            if (exception.cause is NoSuchFileException) {
                throw StorageFileNotFoundException()
            }
            throw FileStorageException()
        } catch (exception: RuntimeException) {
            throw FileStorageException()
        }

        return FileDownload(
            file = file,
            storedObjectResource = storedObjectResource,
        )
    }

    @Transactional
    fun delete(id: String) {
        val file = findById(id) ?: return
        requireOwnerOrAdmin(file.ownerMemberId)
        fileRepository.delete(file)
        eventPublisher.publishEvent(FileDeletedEvent(file.storagePath))
    }

    @Transactional(readOnly = true)
    fun list(
        page: Int,
        size: Int,
    ): FilePageResponse {
        val memberId = requireAuthenticatedMemberId()
        val pageable = try {
            PageSupport.pageRequest(page, size)
        } catch (exception: IllegalArgumentException) {
            throw InvalidStorageRequestException(exception.message ?: "Invalid paging request.")
        }
        val filePage: Page<File> = if (isAdmin()) {
            fileRepository.findAll(pageable)
        } else {
            fileRepository.findByOwnerMemberId(memberId, pageable)
        }

        return FilePageResponse(
            objects = filePage.content.map { it.toResponse() },
            pageInfo = PageInfo(
                totalCount = filePage.totalElements,
                totalPages = filePage.totalPages,
                pageable = filePage.pageable,
            ),
        )
    }

    private fun getById(id: String): File =
        findById(id) ?: throw StorageFileNotFoundException()

    private fun findById(id: String): File? {
        val parsedId = parseId(id)
        return fileRepository.findById(parsedId).orElse(null)
    }

    private fun parseId(id: String): UUID =
        runCatching { UUID.fromString(id) }
            .getOrElse { throw InvalidStorageRequestException("id must be a valid UUID.") }

    private fun requireOwnerOrAdmin(ownerMemberId: Long) {
        val memberId = requireAuthenticatedMemberId()
        if (memberId != ownerMemberId && !isAdmin()) {
            throw StorageForbiddenException()
        }
    }

    private fun requireAuthenticatedMemberId(): Long =
        currentAuthenticatedMemberId() ?: throw StorageUnauthenticatedException()

    private fun currentAuthenticatedMemberId(): Long? =
        SecurityContextHolder.getContext()
            .authentication
            ?.principal
            ?.toString()
            ?.toLongOrNull()

    private fun isAdmin(): Boolean =
        SecurityContextHolder.getContext()
            .authentication
            ?.authorities
            ?.any { it.authority?.removePrefix("ROLE_") == "ADMIN" }
            ?: false

    private fun resolveFileName(originalFilename: String?): String =
        originalFilename
            ?.let { Path.of(it).fileName?.toString() }
            ?.takeIf { it.isNotBlank() }
            ?: DEFAULT_FILE_NAME

    private fun resolveContentType(contentType: String?): String {
        val resolvedContentType = contentType?.takeIf { it.isNotBlank() } ?: DEFAULT_CONTENT_TYPE
        runCatching { MediaType.parseMediaType(resolvedContentType) }
            .getOrElse { throw InvalidStorageRequestException("contentType is invalid.") }
        return resolvedContentType
    }

    private fun buildStoragePath(fileId: UUID): String =
        listOf("objects", fileId.toString().substring(0, 2), fileId.toString()).joinToString("/")

    private fun cleanupNewObject(storagePath: String) {
        runCatching {
            objectStorage.delete(storagePath)
        }
    }

    companion object {
        private const val DEFAULT_CONTENT_TYPE = "application/octet-stream"
        private const val DEFAULT_FILE_NAME = "file"
    }
}
