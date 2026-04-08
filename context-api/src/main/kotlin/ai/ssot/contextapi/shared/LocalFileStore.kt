package ai.ssot.contextapi.shared

import org.springframework.core.io.FileSystemResource
import org.springframework.core.io.Resource
import org.springframework.stereotype.Component
import org.springframework.web.multipart.MultipartFile
import java.io.UncheckedIOException
import java.nio.file.Files
import java.nio.file.NoSuchFileException
import java.nio.file.Path
import java.nio.file.StandardCopyOption

data class StoredFile(
    val resource: Resource,
    val fileName: String,
    val contentLength: Long,
    val lastModifiedMillis: Long,
)

@Component
class LocalFileStore(
    val storageRoot: Path = Path.of(
        System.getProperty("user.home"),
        "dashway",
        "user_profile",
    ),
) {
    fun save(relativePath: String, file: MultipartFile) {
        val targetPath = resolve(relativePath)

        try {
            Files.createDirectories(targetPath.parent)
            file.inputStream.use { input ->
                Files.copy(input, targetPath, StandardCopyOption.REPLACE_EXISTING)
            }
        } catch (exception: Exception) {
            throw UncheckedIOException("Failed to save file.", asIoException(exception))
        }
    }

    fun delete(relativePath: String) {
        val targetPath = resolve(relativePath)

        try {
            Files.deleteIfExists(targetPath)
        } catch (exception: Exception) {
            throw UncheckedIOException("Failed to delete file.", asIoException(exception))
        }
    }

    fun load(relativePath: String): StoredFile {
        val targetPath = resolve(relativePath)

        try {
            if (!Files.exists(targetPath) || !Files.isRegularFile(targetPath)) {
                throw NoSuchFileException(targetPath.toString())
            }

            return StoredFile(
                resource = FileSystemResource(targetPath),
                fileName = targetPath.fileName.toString(),
                contentLength = Files.size(targetPath),
                lastModifiedMillis = Files.getLastModifiedTime(targetPath).toMillis(),
            )
        } catch (exception: Exception) {
            throw UncheckedIOException("Failed to load file.", asIoException(exception))
        }
    }

    private fun resolve(relativePath: String): Path {
        require(relativePath.isNotBlank()) {
            "Relative path must not be blank."
        }

        val resolvedPath = storageRoot.resolve(relativePath).normalize()
        check(resolvedPath.startsWith(storageRoot.normalize())) {
            "Resolved path escapes the storage root."
        }

        return resolvedPath
    }

    private fun asIoException(exception: Exception) =
        when (exception) {
            is java.io.IOException -> exception
            else -> java.io.IOException(exception.message, exception)
        }
}
