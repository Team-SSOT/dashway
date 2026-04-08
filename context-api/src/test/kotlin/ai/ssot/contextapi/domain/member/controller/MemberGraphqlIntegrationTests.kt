package ai.ssot.contextapi.domain.member.controller

import ai.ssot.contextapi.GraphqlBehaviorSpecSupport
import ai.ssot.contextapi.TEST_AUTOCONFIG_EXCLUDES
import ai.ssot.contextapi.generated.client.*
import ai.ssot.contextapi.generated.types.RegisterMemberInput
import ai.ssot.contextapi.generated.types.UpdateMemberInput
import ai.ssot.contextapi.shared.LocalFileStore
import ai.ssot.contextapi.support.TestFileStorageConfig
import com.netflix.graphql.dgs.client.codegen.GraphQLQueryRequest
import io.kotest.matchers.shouldBe
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.context.annotation.Import
import org.springframework.http.HttpHeaders
import org.springframework.mock.web.MockMultipartFile
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import java.nio.file.Files
import java.nio.file.Path

@SpringBootTest(properties = [TEST_AUTOCONFIG_EXCLUDES])
@AutoConfigureMockMvc
@Import(TestFileStorageConfig::class)
class MemberGraphqlIntegrationTests : GraphqlBehaviorSpecSupport() {
    @Autowired
    private lateinit var localFileStore: LocalFileStore

    init {
        given("members") {
            `when`("members exist and paging is valid") {
                then("lists newest members first") {
                    val admin = bootstrapAdmin()
                    val aliceId = registerMember(
                        name = "Alice",
                        email = "alice@example.com",
                        password = "alice-password",
                        accessToken = admin.accessToken,
                    )
                    val bobId = registerMember(
                        name = "Bob",
                        email = "bob@example.com",
                        password = "bob-password",
                        accessToken = admin.accessToken,
                    )

                    val response = executeGraphqlAndRead(
                        membersRequest(page = 0, size = 10),
                        accessToken = admin.accessToken,
                    )

                    response.longAt("/data/members/pageInfo/page") shouldBe 0L
                    response.longAt("/data/members/pageInfo/totalElements") shouldBe 3L
                    response.longAt("/data/members/members/0/id") shouldBe bobId
                    response.longAt("/data/members/members/1/id") shouldBe aliceId
                    response.textAt("/data/members/members/0/email") shouldBe "bob@example.com"
                    response.textAt("/data/members/members/1/email") shouldBe "alice@example.com"
                    response.at("/data/members/members/0/profileImgPath").isNull shouldBe true
                }
            }

            `when`("the request is unauthenticated") {
                then("returns the shared unauthenticated contract") {
                    val response = executeGraphqlAndReadAllowErrors(
                        membersRequest(page = 0, size = 10),
                    )

                    val membersNode = response.at("/data/members")
                    (membersNode.isMissingNode || membersNode.isNull) shouldBe true
                    response.textAt("/errors/0/message") shouldBe "Authentication is required."
                }
            }

            `when`("paging is invalid") {
                then("returns the validation message without custom extensions") {
                    val admin = bootstrapAdmin()

                    val response = executeGraphqlAndReadAllowErrors(
                        membersRequest(page = -1, size = 10),
                        accessToken = admin.accessToken,
                    )

                    val membersNode = response.at("/data/members")
                    (membersNode.isMissingNode || membersNode.isNull) shouldBe true
                    response.textAt("/errors/0/message") shouldBe "page must be 0 or greater."
                    response.at("/errors/0/extensions").isMissingNode shouldBe true
                }
            }
        }

        given("registerMember") {
            `when`("the admin provides the current required input shape") {
                then("creates the member without a profile image and returns authority objects") {
                    val admin = bootstrapAdmin()
                    val teamId = createFixtureTeam("member-team")

                    val response = executeGraphqlAndRead(
                        registerMemberRequest(
                            name = "Alice",
                            email = "alice@example.com",
                            password = "alice-password",
                            teamId = teamId,
                            authorityIds = listOf(3),
                        ),
                        accessToken = admin.accessToken,
                    )

                    response.textAt("/data/registerMember/name") shouldBe "Alice"
                    response.textAt("/data/registerMember/email") shouldBe "alice@example.com"
                    response.at("/data/registerMember/isEnabled").asBoolean() shouldBe true
                    response.at("/data/registerMember/profileImgPath").isNull shouldBe true
                    response.longAt("/data/registerMember/authorities/0/id") shouldBe 3L
                    response.textAt("/data/registerMember/authorities/0/name") shouldBe "MEMBER"
                }
            }

            `when`("the admin uploads a profile image during registration") {
                then("stores the file and returns the stored relative path") {
                    val admin = bootstrapAdmin()
                    val teamId = createFixtureTeam("member-with-image")
                    val fileCountBefore = countStoredFiles()
                    val storedPathsBefore = storedRelativePaths()

                    val response = executeMultipartGraphqlAndRead(
                        query = REGISTER_MEMBER_WITH_FILE_MUTATION,
                        variables = mapOf(
                            "input" to mapOf(
                                "name" to "Image User",
                                "email" to "image-user@example.com",
                                "password" to "image-password",
                                "isEnabled" to true,
                                "teamId" to teamId,
                                "authorityIds" to listOf(3),
                            ),
                            "file" to null,
                        ),
                        uploads = mapOf(
                            "file" to profileImage("avatar.png", "image/png"),
                        ),
                        accessToken = admin.accessToken,
                    )

                    val storedPathsAfter = storedRelativePaths()
                    val newStoredPath = (storedPathsAfter - storedPathsBefore).single()

                    response.textAt("/data/registerMember/profileImgPath") shouldBe newStoredPath
                    countStoredFiles() shouldBe fileCountBefore + 1
                    newStoredPath.startsWith("members/") shouldBe true
                }
            }

            `when`("registration fails after saving the profile image") {
                then("cleans up the stored file") {
                    val admin = bootstrapAdmin()
                    val fileCountBefore = countStoredFiles()

                    val response = executeMultipartGraphql(
                        query = REGISTER_MEMBER_WITH_FILE_MUTATION,
                        variables = mapOf(
                            "input" to mapOf(
                                "name" to "Broken Image User",
                                "email" to "broken-image-user@example.com",
                                "password" to "image-password",
                                "isEnabled" to true,
                                "teamId" to 999_999L,
                                "authorityIds" to listOf(3),
                            ),
                            "file" to null,
                        ),
                        uploads = mapOf(
                            "file" to profileImage("avatar.webp", "image/webp"),
                        ),
                        accessToken = admin.accessToken,
                    ).andReturn().response.contentAsString.let(objectMapper::readTree)

                    val registerNode = response.at("/data/registerMember")
                    (registerNode.isMissingNode || registerNode.isNull) shouldBe true
                    countStoredFiles() shouldBe fileCountBefore
                }
            }

            `when`("the email is already in use") {
                then("returns the duplicate email contract") {
                    val admin = bootstrapAdmin()
                    executeGraphqlAndRead(
                        registerMemberRequest(
                            name = "Alice",
                            email = "alice@example.com",
                            password = "alice-password",
                            teamId = createFixtureTeam("existing-team"),
                            authorityIds = listOf(3),
                        ),
                        accessToken = admin.accessToken,
                    )

                    val response = executeGraphqlAndReadAllowErrors(
                        registerMemberRequest(
                            name = "Another Alice",
                            email = "alice@example.com",
                            password = "another-password",
                            teamId = createFixtureTeam("duplicate-team"),
                            authorityIds = listOf(3),
                        ),
                        accessToken = admin.accessToken,
                    )

                    val registerNode = response.at("/data/registerMember")
                    (registerNode.isMissingNode || registerNode.isNull) shouldBe true
                    response.textAt("/errors/0/message") shouldBe "Member email already exists."
                    response.textAt("/errors/0/extensions/violations/0/field") shouldBe "email"
                }
            }
        }

        given("updateMember") {
            `when`("the member query is unauthenticated") {
                then("returns the shared unauthenticated contract") {
                    val response = executeGraphqlAndReadAllowErrors(
                        memberRequest(1L),
                    )

                    val memberNode = response.at("/data/member")
                    (memberNode.isMissingNode || memberNode.isNull) shouldBe true
                    response.textAt("/errors/0/message") shouldBe "Authentication is required."
                }
            }

            `when`("a member updates their own name") {
                then("persists the new name without admin privileges") {
                    val member = bootstrapMember(
                        name = "Self User",
                        email = "self@example.com",
                        password = "self-password",
                    )

                    val updateResponse = executeGraphqlAndRead(
                        updateMemberRequest(
                            id = member.memberId,
                            name = "Self Renamed",
                        ),
                        accessToken = member.accessToken,
                    )
                    val memberResponse = executeGraphqlAndRead(
                        memberRequest(member.memberId),
                        accessToken = member.accessToken,
                    )

                    updateResponse.textAt("/data/updateMember/name") shouldBe "Self Renamed"
                    updateResponse.textAt("/data/updateMember/email") shouldBe "self@example.com"
                    updateResponse.at("/data/updateMember/profileImgPath").isNull shouldBe true
                    updateResponse.textAt("/data/updateMember/authorities/0/name") shouldBe "MEMBER"
                    memberResponse.textAt("/data/member/name") shouldBe "Self Renamed"
                    memberResponse.textAt("/data/member/authorities/0/name") shouldBe "MEMBER"
                }
            }

            `when`("a member uploads a replacement profile image") {
                then("replaces the old file and returns the new stored relative path") {
                    val member = bootstrapMember(
                        name = "Image Member",
                        email = "image-member@example.com",
                        password = "image-password",
                    )
                    val storedPathsBeforeFirstUpload = storedRelativePaths()

                    val firstUploadResponse = executeMultipartGraphqlAndRead(
                        query = UPDATE_MEMBER_WITH_FILE_MUTATION,
                        variables = mapOf(
                            "input" to mapOf("id" to member.memberId),
                            "file" to null,
                        ),
                        uploads = mapOf(
                            "file" to profileImage("first.jpg", "image/jpeg"),
                        ),
                        accessToken = member.accessToken,
                    )
                    val storedPathsAfterFirstUpload = storedRelativePaths()
                    val firstStoredPath = (storedPathsAfterFirstUpload - storedPathsBeforeFirstUpload).single()
                    firstUploadResponse.textAt("/data/updateMember/profileImgPath") shouldBe
                        firstStoredPath

                    val secondUploadResponse = executeMultipartGraphqlAndRead(
                        query = UPDATE_MEMBER_WITH_FILE_MUTATION,
                        variables = mapOf(
                            "input" to mapOf("id" to member.memberId),
                            "file" to null,
                        ),
                        uploads = mapOf(
                            "file" to profileImage("second.webp", "image/webp"),
                        ),
                        accessToken = member.accessToken,
                    )
                    val storedPathsAfterSecondUpload = storedRelativePaths()
                    val secondStoredPath = (storedPathsAfterSecondUpload - storedPathsAfterFirstUpload).single()

                    secondUploadResponse.textAt("/data/updateMember/profileImgPath") shouldBe
                        secondStoredPath
                    (secondStoredPath != firstStoredPath) shouldBe true
                    storedPathsAfterSecondUpload.contains(firstStoredPath) shouldBe false
                    storedPathsAfterSecondUpload.size shouldBe storedPathsAfterFirstUpload.size
                }
            }

            `when`("an admin updates another member name") {
                then("allows the change and preserves the existing authority") {
                    val admin = bootstrapAdmin()
                    val memberId = registerMember(
                        name = "Alice",
                        email = "alice@example.com",
                        password = "alice-password",
                        accessToken = admin.accessToken,
                    )

                    val updateResponse = executeGraphqlAndRead(
                        updateMemberRequest(
                            id = memberId,
                            name = "Alice Admin",
                        ),
                        accessToken = admin.accessToken,
                    )
                    val memberResponse = executeGraphqlAndRead(
                        memberRequest(memberId),
                        accessToken = admin.accessToken,
                    )

                    updateResponse.textAt("/data/updateMember/name") shouldBe "Alice Admin"
                    updateResponse.textAt("/data/updateMember/authorities/0/name") shouldBe "MEMBER"
                    memberResponse.textAt("/data/member/name") shouldBe "Alice Admin"
                }
            }

            `when`("a non-admin updates another member") {
                then("rejects the request with the shared forbidden contract") {
                    val member = bootstrapMember(
                        name = "Self User",
                        email = "self@example.com",
                        password = "self-password",
                    )
                    val otherMemberId = seedMember(
                        name = "Other User",
                        email = "other@example.com",
                        password = "other-password",
                        authorityIds = listOf(3),
                    )

                    val response = executeGraphqlAndReadAllowErrors(
                        updateMemberRequest(
                            id = otherMemberId,
                            name = "Should Fail",
                        ),
                        accessToken = member.accessToken,
                    )

                    val updateNode = response.at("/data/updateMember")
                    (updateNode.isMissingNode || updateNode.isNull) shouldBe true
                    response.textAt("/errors/0/message") shouldBe "You do not have permission to perform this action."
                }
            }

            `when`("a non-admin tries to update admin-only fields") {
                then("rejects each request and leaves the member unchanged") {
                    val member = bootstrapMember(
                        name = "Self User",
                        email = "self@example.com",
                        password = "self-password",
                    )

                    val responses = listOf(
                        executeGraphqlAndReadAllowErrors(
                            updateMemberRequest(
                                id = member.memberId,
                                isEnabled = false,
                            ),
                            accessToken = member.accessToken,
                        ),
                        executeGraphqlAndReadAllowErrors(
                            updateMemberRequest(
                                id = member.memberId,
                                authorityIds = listOf(1),
                            ),
                            accessToken = member.accessToken,
                        ),
                    )

                    responses.forEach { response ->
                        val updateNode = response.at("/data/updateMember")
                        (updateNode.isMissingNode || updateNode.isNull) shouldBe true
                        response.textAt("/errors/0/message") shouldBe "You do not have permission to perform this action."
                    }

                    val memberResponse = executeGraphqlAndRead(
                        memberRequest(member.memberId),
                        accessToken = member.accessToken,
                    )

                    memberResponse.at("/data/member/isEnabled").asBoolean() shouldBe true
                    memberResponse.textAt("/data/member/authorities/0/name") shouldBe "MEMBER"
                }
            }

            `when`("an admin updates admin-only fields") {
                then("applies isEnabled and authorityIds changes") {
                    val admin = bootstrapAdmin()
                    val memberId = registerMember(
                        name = "Managed User",
                        email = "managed@example.com",
                        password = "managed-password",
                        accessToken = admin.accessToken,
                    )

                    val updateResponse = executeGraphqlAndRead(
                        updateMemberRequest(
                            id = memberId,
                            isEnabled = false,
                            authorityIds = listOf(1),
                        ),
                        accessToken = admin.accessToken,
                    )
                    val memberResponse = executeGraphqlAndRead(
                        memberRequest(memberId),
                        accessToken = admin.accessToken,
                    )

                    updateResponse.at("/data/updateMember/isEnabled").asBoolean() shouldBe false
                    updateResponse.longAt("/data/updateMember/authorities/0/id") shouldBe 1L
                    updateResponse.textAt("/data/updateMember/authorities/0/name") shouldBe "ADMIN"
                    memberResponse.at("/data/member/isEnabled").asBoolean() shouldBe false
                    memberResponse.textAt("/data/member/authorities/0/name") shouldBe "ADMIN"
                }
            }

            `when`("an admin updates a missing member") {
                then("returns the not found contract after the policy check passes") {
                    val admin = bootstrapAdmin()

                    val response = executeGraphqlAndReadAllowErrors(
                        updateMemberRequest(
                            id = 999_999L,
                            name = "Ghost",
                        ),
                        accessToken = admin.accessToken,
                    )

                    val updateNode = response.at("/data/updateMember")
                    (updateNode.isMissingNode || updateNode.isNull) shouldBe true
                    response.textAt("/errors/0/message") shouldBe "Member not found."
                    response.at("/errors/0/extensions").isMissingNode shouldBe true
                }
            }
        }

        given("memberProfileImage") {
            `when`("an authenticated member requests an uploaded profile image") {
                then("returns the stored bytes and cache headers") {
                    val member = bootstrapMember(
                        name = "Rest Member",
                        email = "rest-member@example.com",
                        password = "rest-password",
                    )
                    val upload = profileImage("rest-avatar.png", "image/png")

                    val uploadResponse = executeMultipartGraphqlAndRead(
                        query = UPDATE_MEMBER_WITH_FILE_MUTATION,
                        variables = mapOf(
                            "input" to mapOf("id" to member.memberId),
                            "file" to null,
                        ),
                        uploads = mapOf("file" to upload),
                        accessToken = member.accessToken,
                    )
                    val relativePath = uploadResponse.textAt("/data/updateMember/profileImgPath")

                    val response = mockMvc.perform(
                        get("/$relativePath")
                            .header("Authorization", "Bearer ${member.accessToken}"),
                    )
                        .andExpect(status().isOk)
                        .andReturn()
                        .response

                    response.contentType shouldBe "image/png"
                    response.contentAsByteArray.contentEquals(upload.bytes) shouldBe true
                    response.getHeader(HttpHeaders.ETAG) shouldBe null
                    response.getHeader(HttpHeaders.CACHE_CONTROL)?.contains("private") shouldBe true
                    response.getHeader(HttpHeaders.CACHE_CONTROL)?.contains("max-age=31536000") shouldBe true
                    response.getHeader(HttpHeaders.CACHE_CONTROL)?.contains("immutable") shouldBe true
                }
            }

            `when`("an authenticated member requests a stale profile image path after replacement") {
                then("returns 404 for the old path and 200 for the current path") {
                    val member = bootstrapMember(
                        name = "Versioned Member",
                        email = "versioned-member@example.com",
                        password = "versioned-password",
                    )

                    val firstUploadResponse = executeMultipartGraphqlAndRead(
                        query = UPDATE_MEMBER_WITH_FILE_MUTATION,
                        variables = mapOf(
                            "input" to mapOf("id" to member.memberId),
                            "file" to null,
                        ),
                        uploads = mapOf("file" to profileImage("first.png", "image/png")),
                        accessToken = member.accessToken,
                    )
                    val firstRelativePath = firstUploadResponse.textAt("/data/updateMember/profileImgPath")

                    val secondUploadResponse = executeMultipartGraphqlAndRead(
                        query = UPDATE_MEMBER_WITH_FILE_MUTATION,
                        variables = mapOf(
                            "input" to mapOf("id" to member.memberId),
                            "file" to null,
                        ),
                        uploads = mapOf("file" to profileImage("second.png", "image/png")),
                        accessToken = member.accessToken,
                    )
                    val secondRelativePath = secondUploadResponse.textAt("/data/updateMember/profileImgPath")

                    mockMvc.perform(
                        get("/$firstRelativePath")
                            .header("Authorization", "Bearer ${member.accessToken}"),
                    )
                        .andExpect(status().isNotFound)

                    mockMvc.perform(
                        get("/$secondRelativePath")
                            .header("Authorization", "Bearer ${member.accessToken}"),
                    )
                        .andExpect(status().isOk)
                }
            }

            `when`("an authenticated member requests another filename for the same member") {
                then("returns 404") {
                    val member = bootstrapMember(
                        name = "Wrong Filename Member",
                        email = "wrong-filename-member@example.com",
                        password = "wrong-filename-password",
                    )
                    val uploadResponse = executeMultipartGraphqlAndRead(
                        query = UPDATE_MEMBER_WITH_FILE_MUTATION,
                        variables = mapOf(
                            "input" to mapOf("id" to member.memberId),
                            "file" to null,
                        ),
                        uploads = mapOf("file" to profileImage("expected.png", "image/png")),
                        accessToken = member.accessToken,
                    )
                    val relativePath = uploadResponse.textAt("/data/updateMember/profileImgPath")
                    val wrongRelativePath = relativePath.substringBeforeLast("/") + "/wrong.png"

                    mockMvc.perform(
                        get("/$wrongRelativePath")
                            .header("Authorization", "Bearer ${member.accessToken}"),
                    )
                        .andExpect(status().isNotFound)
                }
            }

            `when`("the request is unauthenticated") {
                then("returns 401") {
                    val member = bootstrapMember(
                        name = "Unauthorized Member",
                        email = "unauthorized-member@example.com",
                        password = "unauthorized-password",
                    )
                    val relativePath = "members/${member.memberId}/profile/test.png"

                    mockMvc.perform(get("/$relativePath"))
                        .andExpect(status().isUnauthorized)
                }
            }
        }
    }

    private fun membersRequest(page: Int, size: Int): GraphQLQueryRequest {
        val projection = MembersProjectionRoot<Nothing, Nothing>()
        projection.pageInfo().page().size().totalElements().totalPages()
        projection.members().id().name().email().profileImgPath().isEnabled().authorities().id().name()

        return GraphQLQueryRequest(
            MembersGraphQLQuery.newRequest()
                .page(page)
                .size(size)
                .build(),
            projection,
        )
    }

    private fun memberRequest(id: Long): GraphQLQueryRequest {
        val projection = MemberProjectionRoot<Nothing, Nothing>()
        projection.id().name().email().profileImgPath().isEnabled().authorities().id().name()

        return GraphQLQueryRequest(
            MemberGraphQLQuery.newRequest()
                .id(id)
                .build(),
            projection,
        )
    }

    private fun registerMemberRequest(
        name: String,
        email: String,
        password: String,
        teamId: Long,
        authorityIds: List<Int>,
        isEnabled: Boolean = true,
    ): GraphQLQueryRequest {
        val projection = RegisterMemberProjectionRoot<Nothing, Nothing>()
        projection.id().name().email().profileImgPath().isEnabled().authorities().id().name()

        return GraphQLQueryRequest(
            RegisterMemberGraphQLQuery.newRequest()
                .input(
                    RegisterMemberInput.newBuilder()
                        .name(name)
                        .email(email)
                        .password(password)
                        .isEnabled(isEnabled)
                        .teamId(teamId)
                        .authorityIds(authorityIds)
                        .build(),
                )
                .build(),
            projection,
        )
    }

    private fun updateMemberRequest(
        id: Long,
        name: String? = null,
        isEnabled: Boolean? = null,
        authorityIds: List<Int>? = null,
    ): GraphQLQueryRequest {
        val projection = UpdateMemberProjectionRoot<Nothing, Nothing>()
        projection.id().name().email().profileImgPath().isEnabled().authorities().id().name()

        val inputBuilder = UpdateMemberInput.newBuilder().id(id)
        if (name != null) {
            inputBuilder.name(name)
        }
        if (isEnabled != null) {
            inputBuilder.isEnabled(isEnabled)
        }
        if (authorityIds != null) {
            inputBuilder.authorityIds(authorityIds)
        }

        return GraphQLQueryRequest(
            UpdateMemberGraphQLQuery.newRequest()
                .input(inputBuilder.build())
                .build(),
            projection,
        )
    }

    private fun profileImage(
        filename: String,
        contentType: String,
    ) = MockMultipartFile(
        "file",
        filename,
        contentType,
        "profile-image-$filename".toByteArray(),
    )

    private fun countStoredFiles(): Long =
        if (!Files.exists(localFileStore.storageRoot)) {
            0L
        } else {
            Files.walk(localFileStore.storageRoot)
                .use { paths ->
                    paths.filter(Files::isRegularFile).count()
                }
        }

    private fun storedRelativePaths(): Set<String> =
        if (!Files.exists(localFileStore.storageRoot)) {
            emptySet()
        } else {
            Files.walk(localFileStore.storageRoot)
                .use { paths ->
                    paths.filter(Files::isRegularFile)
                        .map(localFileStore.storageRoot::relativize)
                        .map(Path::toString)
                        .map { it.replace('\\', '/') }
                        .toList()
                        .toSet()
                }
        }

    companion object {
        private const val REGISTER_MEMBER_WITH_FILE_MUTATION = """
            mutation RegisterMemberWithFile(${ '$' }input: RegisterMemberInput!, ${ '$' }file: Upload) {
              registerMember(input: ${ '$' }input, file: ${ '$' }file) {
                id
                name
                email
                profileImgPath
                isEnabled
              }
            }
        """

        private const val UPDATE_MEMBER_WITH_FILE_MUTATION = """
            mutation UpdateMemberWithFile(${ '$' }input: UpdateMemberInput!, ${ '$' }file: Upload) {
              updateMember(input: ${ '$' }input, file: ${ '$' }file) {
                id
                name
                email
                profileImgPath
                isEnabled
              }
            }
        """
    }
}
