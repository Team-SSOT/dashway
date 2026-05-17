package ai.ssot.contextapi.domain.storage.service

import org.springframework.core.io.FileSystemResource
import org.springframework.stereotype.Component
import java.io.InputStream
import java.io.UncheckedIOException
import java.nio.file.Files
import java.nio.file.NoSuchFileException
import java.nio.file.Path
import java.security.MessageDigest

@Component
class LocalObjectStorage(
    private val storageProperties: StorageProperties,
) : ObjectStorage {
    override fun save(storagePath: String, inputStream: InputStream): StoredObject {
        val targetPath = resolve(storagePath)

        try {
            Files.createDirectories(targetPath.parent)
            val digest = MessageDigest.getInstance("SHA-256")
            var contentLength = 0L
            val buffer = ByteArray(DEFAULT_BUFFER_SIZE)

            inputStream.use { input ->
                Files.newOutputStream(targetPath).use { output ->
                    while (true) {
                        val read = input.read(buffer)
                        if (read < 0) {
                            break
                        }
                        digest.update(buffer, 0, read)
                        output.write(buffer, 0, read)
                        contentLength += read
                    }
                }
            }

            return StoredObject(
                contentLength = contentLength,
                checksumSha256 = digest.digest().joinToString("") { "%02x".format(it.toInt() and 0xff) },
            )
        } catch (exception: Exception) {
            runCatching { Files.deleteIfExists(targetPath) }
            throw UncheckedIOException("Failed to save file.", asIoException(exception))
        }
    }

    override fun load(storagePath: String): StoredObjectResource {
        val targetPath = resolve(storagePath)

        try {
            if (!Files.exists(targetPath) || !Files.isRegularFile(targetPath)) {
                throw NoSuchFileException(targetPath.toString())
            }

            return StoredObjectResource(
                resource = FileSystemResource(targetPath),
                contentLength = Files.size(targetPath),
            )
        } catch (exception: Exception) {
            throw UncheckedIOException("Failed to load file.", asIoException(exception))
        }
    }

    override fun delete(storagePath: String) {
        val targetPath = resolve(storagePath)

        try {
            Files.deleteIfExists(targetPath)
        } catch (exception: Exception) {
            throw UncheckedIOException("Failed to delete file.", asIoException(exception))
        }
    }

    private fun resolve(storagePath: String): Path {
        require(storagePath.isNotBlank()) {
            "Storage path must not be blank."
        }

        val storageRoot = storageProperties.localRoot.normalize()
        val resolvedPath = storageRoot.resolve(storagePath).normalize()
        check(resolvedPath.startsWith(storageRoot)) {
            "Resolved path escapes the storage root."
        }

        return resolvedPath
    }

    private fun asIoException(exception: Exception) =
        when (exception) {
            is java.io.IOException -> exception
            else -> java.io.IOException(exception.message, exception)
        }

    companion object {
        private const val DEFAULT_BUFFER_SIZE = 8192
    }
}
