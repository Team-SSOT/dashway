package ai.ssot.contextapi.domain.member.service

import ai.ssot.contextapi.PostgresIntegrationTestSupport
import ai.ssot.contextapi.TEST_AUTOCONFIG_EXCLUDES
import ai.ssot.contextapi.domain.member.dto.UpdateMemberDto
import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.domain.member.repository.MemberRepository
import ai.ssot.contextapi.shared.LocalFileStore
import ai.ssot.contextapi.support.TestFileStorageConfig
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.support.TransactionTemplate
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

@SpringBootTest(properties = [TEST_AUTOCONFIG_EXCLUDES])
@Import(TestFileStorageConfig::class)
class MemberProfileImageLifecycleIntegrationTests : PostgresIntegrationTestSupport() {
    @Autowired
    private lateinit var localFileStore: LocalFileStore

    @Autowired
    private lateinit var memberProfileImageService: MemberProfileImageService

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var memberService: MemberService

    @Autowired
    private lateinit var passwordEncoder: PasswordEncoder

    @Autowired
    private lateinit var transactionManager: PlatformTransactionManager

    @Test
    fun `updateMember deletes the current file after commit when file is explicitly null`() {
        val member = createMemberWithProfileImage()
        val currentPath = checkNotNull(member.profileImgPath)

        val result = memberService.updateMember(
            input = UpdateMemberDto(id = member.id!!),
            file = null,
            fileArgumentPresent = true,
        )

        assertEquals(null, result.profileImgPath)
        assertFalse(Files.exists(localFileStore.storageRoot.resolve(currentPath)))
        assertEquals(
            null,
            memberRepository.findById(member.id!!).orElseThrow().profileImgPath,
        )
    }

    @Test
    fun `updateMember keeps the current file after rollback when file is explicitly null`() {
        val member = createMemberWithProfileImage()
        val currentPath = checkNotNull(member.profileImgPath)

        assertFailsWith<IllegalStateException> {
            transactionTemplate().executeWithoutResult {
                memberService.updateMember(
                    input = UpdateMemberDto(id = member.id!!),
                    file = null,
                    fileArgumentPresent = true,
                )
                error("force rollback")
            }
        }

        assertTrue(Files.exists(localFileStore.storageRoot.resolve(currentPath)))
        assertEquals(
            currentPath,
            memberRepository.findById(member.id!!).orElseThrow().profileImgPath,
        )
    }

    @Test
    fun `updateMember cleans up the new file after rollback when replacing the current file`() {
        val member = createMemberWithProfileImage()
        val currentPath = checkNotNull(member.profileImgPath)
        lateinit var newPath: String

        assertFailsWith<IllegalStateException> {
            transactionTemplate().executeWithoutResult {
                newPath = memberService.updateMember(
                    input = UpdateMemberDto(id = member.id!!),
                    file = profileImage("next.webp", "image/webp"),
                    fileArgumentPresent = true,
                ).profileImgPath!!
                error("force rollback")
            }
        }

        assertTrue(Files.exists(localFileStore.storageRoot.resolve(currentPath)))
        assertFalse(Files.exists(localFileStore.storageRoot.resolve(newPath)))
        assertEquals(
            currentPath,
            memberRepository.findById(member.id!!).orElseThrow().profileImgPath,
        )
    }

    private fun createMemberWithProfileImage(): Member {
        val member = memberRepository.save(
            Member(
                name = "Image User",
                email = "image-user@example.com",
                password = requireNotNull(passwordEncoder.encode("password")),
                isEnabled = true,
            ),
        )
        val storedPath = memberProfileImageService.store(
            memberId = member.id!!,
            file = profileImage("current.png", "image/png"),
        )
        member.profileImgPath = storedPath
        return memberRepository.save(member)
    }

    private fun profileImage(
        filename: String,
        contentType: String,
    ): MultipartFile =
        org.springframework.mock.web.MockMultipartFile(
            "file",
            filename,
            contentType,
            "profile-image-$filename".toByteArray(),
        )

    private fun transactionTemplate() = TransactionTemplate(transactionManager)
}
