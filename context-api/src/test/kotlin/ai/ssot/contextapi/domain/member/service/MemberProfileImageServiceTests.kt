package ai.ssot.contextapi.domain.member.service

import ai.ssot.contextapi.domain.member.exception.InvalidProfileImageException
import ai.ssot.contextapi.shared.LocalFileStore
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.io.TempDir
import org.springframework.mock.web.MockMultipartFile
import java.nio.file.Files
import java.nio.file.Path
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class MemberProfileImageServiceTests {
    @TempDir
    lateinit var tempDir: Path

    @Test
    fun `store rejects an empty file`() {
        val service = service()

        val exception = assertFailsWith<InvalidProfileImageException> {
            service.store(
                memberId = 1L,
                file = MockMultipartFile("file", "empty.png", "image/png", ByteArray(0)),
            )
        }

        assertEquals("Profile image must not be empty.", exception.message)
    }

    @Test
    fun `store rejects unsupported content type`() {
        val service = service()

        val exception = assertFailsWith<InvalidProfileImageException> {
            service.store(
                memberId = 1L,
                file = MockMultipartFile("file", "avatar.gif", "image/gif", "gif".toByteArray()),
            )
        }

        assertEquals(
            "Profile image content type must be one of image/jpeg, image/png, image/webp.",
            exception.message,
        )
    }

    @Test
    fun `store rejects files larger than five megabytes`() {
        val service = service()
        val oversizedContent = ByteArray((5 * 1024 * 1024) + 1)

        val exception = assertFailsWith<InvalidProfileImageException> {
            service.store(
                memberId = 1L,
                file = MockMultipartFile("file", "avatar.png", "image/png", oversizedContent),
            )
        }

        assertEquals("Profile image must be 5MB or smaller.", exception.message)
    }

    @Test
    fun `store persists the uploaded file under the member profile path`() {
        val service = service()
        val storedPath = service.store(
            memberId = 7L,
            file = image("avatar.webp", "image/webp", "avatar"),
        )

        assertTrue(storedPath.startsWith("members/7/profile/"))
        assertTrue(storedPath.endsWith(".webp"))
        assertTrue(Files.exists(tempDir.resolve(storedPath)))
    }

    @Test
    fun `cleanupQuietly removes an existing file`() {
        val service = service()
        val currentPath = service.store(
            memberId = 9L,
            file = image("current.jpg", "image/jpeg", "current"),
        )

        service.cleanupQuietly(currentPath, "test cleanup")

        assertFalse(Files.exists(tempDir.resolve(currentPath)))
    }

    private fun service() = MemberProfileImageService(LocalFileStore(tempDir))

    private fun image(
        filename: String,
        contentType: String,
        body: String,
    ) = MockMultipartFile(
        "file",
        filename,
        contentType,
        body.toByteArray(),
    )
}
