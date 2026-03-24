package ai.ssot.contextapi.domain.member.controller

import ai.ssot.contextapi.GraphqlIntegrationTestSupport
import org.hamcrest.Matchers.containsString
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import kotlin.test.assertEquals

@SpringBootTest
@AutoConfigureMockMvc
class MemberGraphqlIntegrationTests : GraphqlIntegrationTestSupport() {
    @Test
    fun `lists newest members first and rejects invalid paging inputs`() {
        val admin = bootstrapAdmin()
        val firstMemberId = registerMember("Alice", "alice@example.com", "alice-password", admin.accessToken)
        val secondMemberId = registerMember("Bob", "bob@example.com", "bob-password", admin.accessToken)

        executeGraphql(
            """
            query {
              members(page: 0, size: 10) {
                items {
                  id
                  email
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.members.items[0].id").value(secondMemberId.toInt()))
            .andExpect(jsonPath("$.data.members.items[1].id").value(firstMemberId.toInt()))

        executeGraphql(
            """
            query {
              members(page: -1, size: 10) {
                page
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.errors[0].message", containsString("page must be 0 or greater.")))
    }

    @Test
    fun `registers updates and queries members over graphql`() {
        val admin = bootstrapAdmin()
        val memberId = registerMember("Alice", "alice@example.com", "alice-password", admin.accessToken)

        executeGraphql(
            """
            mutation {
              updateMember(input: {
                id: $memberId
                name: "Alice Admin"
                admin: true
                enabled: false
              }) {
                member {
                  id
                  name
                  email
                  admin
                  enabled
                }
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.updateMember.member.name").value("Alice Admin"))
            .andExpect(jsonPath("$.data.updateMember.member.admin").value(true))
            .andExpect(jsonPath("$.data.updateMember.member.enabled").value(false))
            .andExpect(jsonPath("$.data.updateMember.errors").isEmpty())

        executeGraphql(
            """
            query {
              members(page: 0, size: 10) {
                page
                totalElements
                items {
                  id
                  email
                  enabled
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.members.page").value(0))
            .andExpect(jsonPath("$.data.members.totalElements").value(2))
            .andExpect(jsonPath("$.data.members.items[0].id").value(memberId.toInt()))
            .andExpect(jsonPath("$.data.members.items[0].enabled").value(false))
    }

    @Test
    fun `rejects duplicate member email`() {
        val admin = bootstrapAdmin()
        registerMember("Alice", "alice@example.com", "alice-password", admin.accessToken)

        executeGraphql(
            """
            mutation {
              registerMember(input: {
                name: "Another Alice"
                email: "alice@example.com"
                password: "another-password"
              }) {
                member {
                  id
                }
                errors {
                  code
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.registerMember.member").doesNotExist())
            .andExpect(jsonPath("$.data.registerMember.errors[0].code").value("DUPLICATE_MEMBER_EMAIL"))
    }

    @Test
    fun `returns not found and leaves state unchanged when updating a missing member`() {
        val admin = bootstrapAdmin()

        executeGraphql(
            """
            mutation {
              updateMember(input: {
                id: 999999
                name: "Ghost"
              }) {
                member {
                  id
                }
                errors {
                  code
                  message
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.updateMember.member").doesNotExist())
            .andExpect(jsonPath("$.data.updateMember.errors[0].code").value("NOT_FOUND"))
            .andExpect(jsonPath("$.data.updateMember.errors[0].message").value("Member not found."))
    }

    @Test
    fun `returns multiple validation errors without persisting partial member updates`() {
        val admin = bootstrapAdmin()
        val memberId = registerMember("Alice", "alice@example.com", "alice-password", admin.accessToken)

        executeGraphql(
            """
            mutation {
              updateMember(input: {
                id: $memberId
                name: "   "
                email: "   "
                admin: true
              }) {
                member {
                  id
                }
                errors {
                  code
                  message
                }
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.updateMember.member").doesNotExist())
            .andExpect(jsonPath("$.data.updateMember.errors[0].code").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.data.updateMember.errors[1].code").value("VALIDATION_ERROR"))

        val response = executeGraphqlAndRead(
            """
            query {
              member(id: $memberId) {
                name
                email
                admin
              }
            }
            """.trimIndent(),
            admin.accessToken,
        )

        assertEquals("Alice", response.textAt("/data/member/name"))
        assertEquals("alice@example.com", response.textAt("/data/member/email"))
        assertEquals(false, response.at("/data/member/admin").asBoolean())
    }
}
