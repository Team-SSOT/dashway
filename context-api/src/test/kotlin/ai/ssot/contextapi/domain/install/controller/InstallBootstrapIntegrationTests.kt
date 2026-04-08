package ai.ssot.contextapi.domain.install.controller

import ai.ssot.contextapi.PostgresIntegrationTestSupport
import ai.ssot.contextapi.TEST_AUTOCONFIG_EXCLUDES
import ai.ssot.contextapi.domain.app.repository.AppRepository
import ai.ssot.contextapi.domain.auth.entity.MemberAuthority
import ai.ssot.contextapi.domain.auth.entity.MemberAuthorityId
import ai.ssot.contextapi.domain.auth.repository.MemberAuthorityRepository
import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.domain.member.repository.MemberRepository
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldNotBeBlank
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.http.MediaType
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import tools.jackson.databind.ObjectMapper

@SpringBootTest(
    properties = [
        TEST_AUTOCONFIG_EXCLUDES,
        "context-api.install.bootstrap-enabled=true",
        "context-api.install.bootstrap-secret=test-bootstrap-secret",
    ],
)
@AutoConfigureMockMvc
class InstallBootstrapIntegrationTests : PostgresIntegrationTestSupport() {
    @Autowired
    private lateinit var appRepository: AppRepository

    @Autowired
    private lateinit var memberAuthorityRepository: MemberAuthorityRepository

    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var passwordEncoder: PasswordEncoder

    @Test
    fun `bootstrap health succeeds when install bootstrap is enabled`() {
        mockMvc.perform(get("/internal/install/health"))
            .andExpect(status().isOk)
    }

    @Test
    fun `bootstrap creates the admin and syncs apps`() {
        val response = executeBootstrap(
            request = mapOf(
                "admin" to mapOf(
                    "name" to "Alice Admin",
                    "email" to "admin@example.com",
                    "password" to "super-secret",
                ),
                "apps" to listOf(
                    mapOf(
                        "id" to "fd5f5b50-f945-4577-aadb-4a0f1d6ec1b7",
                        "name" to "chat",
                        "port" to 8090,
                    ),
                    mapOf(
                        "id" to "b4666c56-e479-4c7f-a99e-c881d9c239e9",
                        "name" to "tasks",
                        "port" to 8091,
                    ),
                ),
                "selectedAppIds" to listOf("fd5f5b50-f945-4577-aadb-4a0f1d6ec1b7"),
            ),
        )

        response.at("/adminEmail").asText() shouldBe "admin@example.com"
        response.at("/adminCreated").asBoolean() shouldBe true
        response.at("/syncedAppCount").asInt() shouldBe 2
        response.at("/enabledAppIds/0").asText() shouldBe "fd5f5b50-f945-4577-aadb-4a0f1d6ec1b7"

        val admin = checkNotNull(memberRepository.findByEmail("admin@example.com"))
        admin.name shouldBe "Alice Admin"
        admin.isEnabled shouldBe true
        passwordEncoder.matches("super-secret", admin.password) shouldBe true
        admin.password.shouldNotBeBlank()
        memberAuthorityRepository.existsById(MemberAuthorityId(admin.id!!, 1)) shouldBe true

        val apps = appRepository.findAll().associateBy { it.name }
        apps["chat"]?.isEnabled shouldBe true
        apps["chat"]?.port shouldBe 8090
        apps["tasks"]?.isEnabled shouldBe false
        apps["tasks"]?.port shouldBe 8091
    }

    @Test
    fun `bootstrap is idempotent for the same admin email`() {
        executeBootstrap(
            request = mapOf(
                "admin" to mapOf(
                    "name" to "Alice Admin",
                    "email" to "admin@example.com",
                    "password" to "first-secret",
                ),
                "apps" to listOf(
                    mapOf(
                        "id" to "fd5f5b50-f945-4577-aadb-4a0f1d6ec1b7",
                        "name" to "chat",
                        "port" to 8090,
                    ),
                    mapOf(
                        "id" to "b4666c56-e479-4c7f-a99e-c881d9c239e9",
                        "name" to "tasks",
                        "port" to 8091,
                    ),
                ),
                "selectedAppIds" to listOf("fd5f5b50-f945-4577-aadb-4a0f1d6ec1b7"),
            ),
        )

        val response = executeBootstrap(
            request = mapOf(
                "admin" to mapOf(
                    "name" to "Alice Reapplied",
                    "email" to "admin@example.com",
                    "password" to "second-secret",
                ),
                "apps" to listOf(
                    mapOf(
                        "id" to "fd5f5b50-f945-4577-aadb-4a0f1d6ec1b7",
                        "name" to "chat",
                        "port" to 9090,
                    ),
                    mapOf(
                        "id" to "b4666c56-e479-4c7f-a99e-c881d9c239e9",
                        "name" to "tasks",
                        "port" to 8091,
                    ),
                ),
                "selectedAppIds" to listOf("b4666c56-e479-4c7f-a99e-c881d9c239e9"),
            ),
        )

        response.at("/adminCreated").asBoolean() shouldBe false
        memberRepository.findAll().size shouldBe 1

        val admin = checkNotNull(memberRepository.findByEmail("admin@example.com"))
        admin.name shouldBe "Alice Reapplied"
        passwordEncoder.matches("second-secret", admin.password) shouldBe true

        val apps = appRepository.findAll().associateBy { it.name }
        apps["chat"]?.isEnabled shouldBe false
        apps["chat"]?.port shouldBe 9090
        apps["tasks"]?.isEnabled shouldBe true
    }

    @Test
    fun `bootstrap rejects a different admin email when an admin already exists`() {
        val existingAdminId = checkNotNull(
            memberRepository.save(
                Member(
                    name = "Existing Admin",
                    email = "existing-admin@example.com",
                    password = requireNotNull(passwordEncoder.encode("existing-secret")),
                    isEnabled = true,
                ),
            ).id,
        )
        memberAuthorityRepository.save(
            MemberAuthority(
                id = MemberAuthorityId(existingAdminId, 1),
            ),
        )

        mockMvc.perform(
            post("/internal/install/bootstrap")
                .header("X-Dashway-Install-Secret", "test-bootstrap-secret")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        mapOf(
                            "admin" to mapOf(
                                "name" to "Alice Admin",
                                "email" to "new-admin@example.com",
                                "password" to "super-secret",
                            ),
                            "apps" to emptyList<Any>(),
                            "selectedAppIds" to emptyList<String>(),
                        ),
                    ),
                ),
        )
            .andExpect(status().isConflict)
    }

    @Test
    fun `bootstrap rejects invalid install secret`() {
        mockMvc.perform(
            post("/internal/install/bootstrap")
                .header("X-Dashway-Install-Secret", "wrong-secret")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        mapOf(
                            "admin" to mapOf(
                                "name" to "Alice Admin",
                                "email" to "admin@example.com",
                                "password" to "super-secret",
                            ),
                            "apps" to emptyList<Any>(),
                            "selectedAppIds" to emptyList<String>(),
                        ),
                    ),
                ),
        )
            .andExpect(status().isForbidden)
    }

    private fun executeBootstrap(request: Any) =
        mockMvc.perform(
            post("/internal/install/bootstrap")
                .header("X-Dashway-Install-Secret", "test-bootstrap-secret")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)),
        )
            .andExpect(status().isOk)
            .andReturn()
            .response
            .contentAsString
            .let(objectMapper::readTree)
}
