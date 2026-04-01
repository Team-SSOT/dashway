package ai.ssot.contextapi.domain.member.controller

import ai.ssot.contextapi.GraphqlBehaviorSpecSupport
import ai.ssot.contextapi.generated.client.MemberGraphQLQuery
import ai.ssot.contextapi.generated.client.MemberProjectionRoot
import ai.ssot.contextapi.generated.client.MembersGraphQLQuery
import ai.ssot.contextapi.generated.client.MembersProjectionRoot
import ai.ssot.contextapi.generated.client.RegisterMemberGraphQLQuery
import ai.ssot.contextapi.generated.client.RegisterMemberProjectionRoot
import ai.ssot.contextapi.generated.client.UpdateMemberGraphQLQuery
import ai.ssot.contextapi.generated.client.UpdateMemberProjectionRoot
import ai.ssot.contextapi.generated.types.RegisterMemberInput
import ai.ssot.contextapi.generated.types.UpdateMemberInput
import com.netflix.graphql.dgs.client.codegen.GraphQLQueryRequest
import io.kotest.matchers.shouldBe
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc

@SpringBootTest
@AutoConfigureMockMvc
class MemberGraphqlIntegrationTests : GraphqlBehaviorSpecSupport() {
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
                then("creates the member and returns authority objects") {
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
                    response.longAt("/data/registerMember/authorities/0/id") shouldBe 3L
                    response.textAt("/data/registerMember/authorities/0/name") shouldBe "MEMBER"
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
                    updateResponse.textAt("/data/updateMember/authorities/0/name") shouldBe "MEMBER"
                    memberResponse.textAt("/data/member/name") shouldBe "Self Renamed"
                    memberResponse.textAt("/data/member/authorities/0/name") shouldBe "MEMBER"
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
    }

    private fun membersRequest(page: Int, size: Int): GraphQLQueryRequest {
        val projection = MembersProjectionRoot<Nothing, Nothing>()
        projection.pageInfo().page().size().totalElements().totalPages()
        projection.members().id().name().email().isEnabled().authorities().id().name()

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
        projection.id().name().email().isEnabled().authorities().id().name()

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
        projection.id().name().email().isEnabled().authorities().id().name()

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
        projection.id().name().email().isEnabled().authorities().id().name()

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
}
