package ai.ssot.contextapi.domain.member.service

import ai.ssot.contextapi.domain.member.exception.InvalidProfileImageException
import ai.ssot.contextapi.domain.member.exception.ProfileImageStorageException
import ai.ssot.contextapi.shared.LocalFileStore
import ai.ssot.contextapi.shared.StoredFile
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Service
import org.springframework.web.multipart.MultipartFile
import java.nio.file.NoSuchFileException
import java.nio.file.Path
import java.util.*

@Service
class MemberProfileImageService(
    private val localFileStore: LocalFileStore,
) {
    private val logger = KotlinLogging.logger { }

    /**
     * Validates and stores a member profile image, then returns the generated relative path.
     *
     * The stored file path follows the `members/{memberId}/profile/{uuid}.{ext}` pattern and can be
     * persisted directly to `Member.profileImgPath`.
     *
     * @param memberId owner of the profile image
     * @param file multipart file uploaded by the client
     * @return generated relative storage path for the saved image
     * @throws InvalidProfileImageException when the file is empty, larger than 5 MB, or not one of
     * the supported image content types
     * @throws ProfileImageStorageException when the file cannot be persisted to the file store
     */
    fun store(memberId: Long, file: MultipartFile): String {
        validate(file)
        val relativePath = buildRelativePath(memberId, file.contentType!!)

        try {
            localFileStore.save(relativePath, file)
        } catch (exception: RuntimeException) {
            throw ProfileImageStorageException()
        }

        return relativePath
    }

    /**
     * Attempts to delete a stored file and logs a warning instead of propagating the failure.
     *
     * This is intended for best-effort cleanup paths such as rollback or deletion of a superseded
     * image.
     *
     * @param relativePath relative storage path of the file to delete
     * @param reason short description included in the warning log
     */
    fun cleanupQuietly(relativePath: String, reason: String) {
        runCatching {
            localFileStore.delete(relativePath)
        }.onFailure { exception ->
            logger.warn(exception) { "Failed to $reason for relative path $relativePath." }
        }
    }

    /**
     * Loads a stored profile image.
     *
     * Returns `null` when [relativePath] is `null` or when the referenced file is already missing.
     * Storage access failures other than missing files are surfaced as [ProfileImageStorageException].
     *
     * @param relativePath relative storage path previously returned by [store]
     * @return stored file information for download/streaming, or `null` when no loadable image exists
     */
    fun load(relativePath: String?): StoredFile? {
        return relativePath?.runCatching {
            localFileStore.load(this)
        }?.onFailure { exception ->
            if (exception.cause is NoSuchFileException) {
                logger.warn { "Profile image file not found for relative path $relativePath." }
                return null
            }
            throw ProfileImageStorageException()
        }?.getOrNull()
    }

    /**
     * Enforces the upload constraints for profile images before they are written to storage.
     */
    private fun validate(file: MultipartFile) {
        if (file.isEmpty || file.size == 0L) {
            throw InvalidProfileImageException("Profile image must not be empty.")
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            throw InvalidProfileImageException("Profile image must be 5MB or smaller.")
        }

        val contentType = file.contentType
        if (contentType !in ALLOWED_CONTENT_TYPES) {
            throw InvalidProfileImageException(
                "Profile image content type must be one of image/jpeg, image/png, image/webp.",
            )
        }
    }

    /**
     * Builds the storage path for a member profile image using the member-specific directory and an
     * extension derived from the content type.
     */
    private fun buildRelativePath(memberId: Long, contentType: String): String =
        Path.of(
            "members",
            memberId.toString(),
            "profile",
            "${UUID.randomUUID()}.${EXTENSIONS_BY_CONTENT_TYPE.getValue(contentType)}",
        ).joinToString("/") { it.toString() }

    companion object {
        private val logger = KotlinLogging.logger { }

        private const val MAX_FILE_SIZE_BYTES = 5L * 1024L * 1024L

        private val ALLOWED_CONTENT_TYPES = setOf(
            "image/jpeg",
            "image/png",
            "image/webp",
        )

        private val EXTENSIONS_BY_CONTENT_TYPE = mapOf(
            "image/jpeg" to "jpg",
            "image/png" to "png",
            "image/webp" to "webp",
        )
    }
}
