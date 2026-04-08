package ai.ssot.contextapi.domain.member.controller

import graphql.schema.DataFetchingEnvironmentImpl
import org.junit.jupiter.api.Test
import org.springframework.mock.web.MockMultipartFile
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertSame
import kotlin.test.assertTrue

class MemberControllerFileInputResolverTests {
    @Test
    fun `resolveFileInput keeps the file unchanged when the argument is absent`() {
        val dfe = DataFetchingEnvironmentImpl.newDataFetchingEnvironment()
            .arguments(mapOf("input" to mapOf("id" to 1L)))
            .build()

        val resolved = resolveFileInput(dfe)

        assertFalse(resolved.fileArgumentPresent)
        assertNull(resolved.file)
    }

    @Test
    fun `resolveFileInput marks an explicit null file as present`() {
        val dfe = DataFetchingEnvironmentImpl.newDataFetchingEnvironment()
            .arguments(mapOf("input" to mapOf("id" to 1L), "file" to null))
            .build()

        val resolved = resolveFileInput(dfe)

        assertTrue(resolved.fileArgumentPresent)
        assertNull(resolved.file)
    }

    @Test
    fun `resolveFileInput returns the uploaded file when present`() {
        val file = MockMultipartFile(
            "file",
            "avatar.png",
            "image/png",
            "avatar".toByteArray(),
        )
        val dfe = DataFetchingEnvironmentImpl.newDataFetchingEnvironment()
            .arguments(mapOf("input" to mapOf("id" to 1L), "file" to file))
            .build()

        val resolved = resolveFileInput(dfe)

        assertTrue(resolved.fileArgumentPresent)
        assertSame(file, resolved.file)
    }
}
