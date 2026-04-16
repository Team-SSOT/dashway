package ai.ssot.contextapi.domain.search.controller

import com.meilisearch.sdk.Client
import ai.ssot.contextapi.GraphqlBehaviorSpecSupport
import ai.ssot.contextapi.MeilisearchIntegrationTestEnvironment
import ai.ssot.contextapi.TEST_AUTOCONFIG_EXCLUDES
import ai.ssot.contextapi.indexAppContentDocuments
import ai.ssot.contextapi.resetMeilisearchState
import ai.ssot.contextapi.config.MeilisearchSearchProperties
import ai.ssot.contextapi.generated.client.SearchGraphQLQuery
import ai.ssot.contextapi.generated.client.SearchProjectionRoot
import ai.ssot.contextapi.generated.types.SearchInput
import ai.ssot.contextapi.generated.types.SourceType
import ai.ssot.contextapi.infrastructure.search.AppContentDocument
import com.netflix.graphql.dgs.client.codegen.GraphQLQueryRequest
import io.kotest.matchers.shouldBe
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import java.util.UUID

@SpringBootTest(properties = [TEST_AUTOCONFIG_EXCLUDES])
@AutoConfigureMockMvc
class SearchGraphqlIntegrationTests : GraphqlBehaviorSpecSupport() {
    @Autowired
    private lateinit var meilisearchClient: Client

    @Autowired
    private lateinit var meilisearchProperties: MeilisearchSearchProperties

    init {
        beforeTest {
            resetSearchIndex()
        }

        given("search") {
            `when`("the request is unauthenticated") {
                then("returns the shared unauthenticated contract") {
                    val response = executeGraphqlAndReadAllowErrors(
                        searchRequest(
                            SearchInput.newBuilder()
                                .query("alice")
                                .page(0)
                                .size(20)
                                .build(),
                        ),
                    )

                    val searchNode = response.at("/data/search")
                    (searchNode.isMissingNode || searchNode.isNull) shouldBe true
                    response.textAt("/errors/0/message") shouldBe "Authentication is required."
                }
            }

            `when`("member, team, and app results are available") {
                then("returns all source items with shared page info") {
                    val member = bootstrapMember(
                        name = "Requester",
                        email = "requester@example.com",
                        password = "member-password",
                    )
                    seedMember(
                        name = "Alice Johnson",
                        email = "alice@example.com",
                        password = "alice-password",
                        authorityIds = listOf(3),
                    )
                    createFixtureTeam("Alice Platform")
                    indexAppContent(
                        sourceId = UUID.randomUUID().toString(),
                        title = "Alice handbook",
                        content = "Alice onboarding guide",
                        memberIds = listOf(member.memberId),
                    )

                    val response = executeGraphqlAndRead(
                        searchRequest(
                            SearchInput.newBuilder()
                                .query("alice")
                                .page(0)
                                .size(20)
                                .build(),
                        ),
                        accessToken = member.accessToken,
                    )

                    response.longAt("/data/search/pageInfo/page") shouldBe 0L
                    response.longAt("/data/search/pageInfo/size") shouldBe 20L
                    response.longAt("/data/search/pageInfo/totalElements") shouldBe 3L
                    response.at("/data/search/sourceErrors").size() shouldBe 0

                    val items = response.at("/data/search/items").toList()
                    items.size shouldBe 3
                    items.map { it.at("/__typename").asText() }.toSet() shouldBe setOf(
                        "MemberSearchItem",
                        "TeamSearchItem",
                        "AppSearchItem",
                    )

                    val memberItem = items.first { it.at("/__typename").asText() == "MemberSearchItem" }
                    memberItem.at("/email").asText() shouldBe "alice@example.com"

                    val teamItem = items.first { it.at("/__typename").asText() == "TeamSearchItem" }
                    teamItem.at("/name").asText() shouldBe "Alice Platform"

                    val appItem = items.first { it.at("/__typename").asText() == "AppSearchItem" }
                    appItem.at("/content").asText() shouldBe "Alice onboarding guide"
                    appItem.at("/rawPayload/title").asText() shouldBe "Alice handbook"
                    appItem.at("/sources").asText() shouldBe "APP"
                }
            }

            `when`("sources is limited to app") {
                then("returns only app items") {
                    val member = bootstrapMember(
                        name = "Requester",
                        email = "requester@example.com",
                        password = "member-password",
                    )
                    seedMember(
                        name = "Docs Member",
                        email = "docs-member@example.com",
                        password = "docs-password",
                        authorityIds = listOf(3),
                    )
                    createFixtureTeam("Docs Team")
                    indexAppContent(
                        sourceId = "app-1",
                        title = "Docs handbook",
                        content = "Docs guide",
                        memberIds = listOf(member.memberId),
                    )

                    val response = executeGraphqlAndRead(
                        searchRequest(
                            SearchInput.newBuilder()
                                .query("docs")
                                .sources(listOf(SourceType.APP))
                                .page(0)
                                .size(20)
                                .build(),
                        ),
                        accessToken = member.accessToken,
                    )

                    response.at("/data/search/items").size() shouldBe 1
                    response.textAt("/data/search/items/0/__typename") shouldBe "AppSearchItem"
                    response.textAt("/data/search/items/0/sourceId") shouldBe "app-1"
                    response.at("/data/search/sourceErrors").size() shouldBe 0
                }
            }

            `when`("one app document is invalid but another succeeds") {
                then("returns partial results and source errors together") {
                    val member = bootstrapMember(
                        name = "Requester",
                        email = "requester@example.com",
                        password = "member-password",
                    )
                    indexAppContent(
                        sourceId = "app-1",
                        title = "Docs handbook",
                        content = "Docs guide",
                        memberIds = listOf(member.memberId),
                    )
                    indexAppContent(
                        sourceId = "app-2",
                        title = "Broken docs",
                        content = "Broken guide",
                        rawPayload = "not-json",
                        memberIds = listOf(member.memberId),
                    )

                    val response = executeGraphqlAndRead(
                        searchRequest(
                            SearchInput.newBuilder()
                                .query("docs")
                                .sources(listOf(SourceType.APP))
                                .page(0)
                                .size(10)
                                .build(),
                        ),
                        accessToken = member.accessToken,
                    )

                    response.at("/data/search/items").size() shouldBe 1
                    response.textAt("/data/search/items/0/__typename") shouldBe "AppSearchItem"
                    response.at("/data/search/sourceErrors").size() shouldBe 1
                    response.textAt("/data/search/sourceErrors/0/sourceType") shouldBe "APP"
                    response.textAt("/data/search/sourceErrors/0/code") shouldBe "INVALID_RESPONSE"
                    response.textAt("/data/search/sourceErrors/0/message") shouldBe "App content rawPayload must be valid JSON."
                }
            }

            `when`("an app document is not authorized for the requester") {
                then("returns only accessible app items") {
                    val member = bootstrapMember(
                        name = "Requester",
                        email = "requester@example.com",
                        password = "member-password",
                    )
                    indexAppContent(
                        sourceId = "app-visible",
                        title = "Visible docs",
                        content = "Visible guide",
                        memberIds = listOf(member.memberId),
                        teamIds = emptyList(),
                    )
                    indexAppContent(
                        sourceId = "app-hidden",
                        title = "Hidden docs",
                        content = "Hidden guide",
                        memberIds = listOf(999999),
                        teamIds = listOf(999999),
                    )

                    val response = executeGraphqlAndRead(
                        searchRequest(
                            SearchInput.newBuilder()
                                .query("docs")
                                .sources(listOf(SourceType.APP))
                                .page(0)
                                .size(20)
                                .build(),
                        ),
                        accessToken = member.accessToken,
                    )

                    response.at("/data/search/items").size() shouldBe 1
                    response.textAt("/data/search/items/0/sourceId") shouldBe "app-visible"
                    response.at("/data/search/sourceErrors").size() shouldBe 0
                }
            }
        }
    }

    private fun searchRequest(input: SearchInput): GraphQLQueryRequest {
        val projection = SearchProjectionRoot<Nothing, Nothing>()
        projection.pageInfo().page().size().totalElements().totalPages()
        projection.sourceErrors()
            .message()
            .also {
                it.code()
                it.sourceType()
            }
        projection.items()
            .__typename()
            .sourceId()
            .title()
            .createdDatetime()
            .also {
                it.sources()
                it.onMemberSearchItem().name().email().createdDatetime()
                it.onTeamSearchItem().name().createdDatetime()
                it.onAppSearchItem().content().rawPayload().createdDatetime()
            }

        return GraphQLQueryRequest(
            SearchGraphQLQuery.newRequest()
                .input(input)
                .build(),
            projection,
        )
    }

    private fun resetSearchIndex() {
        resetMeilisearchState(meilisearchClient, meilisearchProperties)
    }

    private fun indexAppContent(
        sourceId: String,
        title: String,
        content: String,
        rawPayload: String = """{"sourceId":"$sourceId","title":"$title"}""",
        createdDatetime: String = "2026-04-10T09:30:00",
        memberIds: List<Long> = emptyList(),
        teamIds: List<Long> = emptyList(),
    ) {
        indexAppContentDocuments(
            client = meilisearchClient,
            properties = meilisearchProperties,
            documents = listOf(
                AppContentDocument(
                    id = "doc-$sourceId",
                    source = SourceType.APP,
                    sourceId = sourceId,
                    title = title,
                    content = content,
                    rawPayload = rawPayload,
                    createdDatetime = createdDatetime,
                    memberIds = memberIds,
                    teamIds = teamIds,
                ),
            ),
        )
    }

    companion object {
        @JvmStatic
        @DynamicPropertySource
        fun registerMeilisearchProperties(registry: DynamicPropertyRegistry) {
            MeilisearchIntegrationTestEnvironment.registerProperties(registry)
        }
    }
}
