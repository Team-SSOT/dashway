package ai.ssot.contextapi.domain.team.repository

import ai.ssot.contextapi.IntegrationTestEnvironment
import ai.ssot.contextapi.TEST_AUTOCONFIG_EXCLUDES
import ai.ssot.contextapi.config.QueryDslConfig
import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.domain.member.repository.MemberRepository
import ai.ssot.contextapi.domain.team.entity.Team
import ai.ssot.contextapi.domain.team.entity.TeamMember
import ai.ssot.contextapi.domain.team.entity.TeamMemberId
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase
import org.springframework.context.annotation.Import
import org.junit.jupiter.api.Test
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

@DataJpaTest(properties = [TEST_AUTOCONFIG_EXCLUDES])
@Import(QueryDslConfig::class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TeamRepositoryIntegrationTests {
    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var teamMemberRepository: TeamMemberRepository

    @Autowired
    private lateinit var teamRepository: TeamRepository

    @Test
    fun `returns all team memberships for the member`() {
        val fixture = seedFixture()

        val memberships = teamMemberRepository.findAllByIdMemberId(fixture.enabledMemberId)

        assertEquals(
            setOf(fixture.platformTeamId, fixture.securityTeamId),
            memberships.map { it.id.teamId }.toSet(),
        )
    }

    @Test
    fun `returns enabled member projections only`() {
        val fixture = seedFixture()

        val teamIdToMembers = teamMemberRepository.getTeamIdToMembers(
            listOf(
                fixture.platformTeamId,
                fixture.disabledOnlyTeamId,
                fixture.emptyTeamId,
            ),
        )

        assertEquals(
            listOf(fixture.enabledMemberId),
            teamIdToMembers.getValue(fixture.platformTeamId).map { checkNotNull(it.id) },
        )
        assertNull(teamIdToMembers[fixture.disabledOnlyTeamId])
        assertNull(teamIdToMembers[fixture.emptyTeamId])
    }

    @Test
    fun `distinguishes teams with and without memberships`() {
        val fixture = seedFixture()

        assertTrue(teamMemberRepository.existsByIdTeamId(fixture.platformTeamId))
        assertFalse(teamMemberRepository.existsByIdTeamId(fixture.emptyTeamId))
    }

    companion object {
        @JvmStatic
        @DynamicPropertySource
        fun registerDataSourceProperties(registry: DynamicPropertyRegistry) {
            IntegrationTestEnvironment.registerDataSourceProperties(registry)
        }
    }

    private data class Fixture(
        val enabledMemberId: Long,
        val platformTeamId: Long,
        val securityTeamId: Long,
        val disabledOnlyTeamId: Long,
        val emptyTeamId: Long,
    )

    private fun seedFixture(): Fixture {
        val enabledMemberId = saveMember(
            name = "enabled-member",
            email = "enabled-member@example.com",
            isEnabled = true,
        )
        val disabledMemberId = saveMember(
            name = "disabled-member",
            email = "disabled-member@example.com",
            isEnabled = false,
        )
        val platformTeamId = saveTeam("platform")
        val securityTeamId = saveTeam("security")
        val disabledOnlyTeamId = saveTeam("disabled-only")
        val emptyTeamId = saveTeam("empty")

        teamMemberRepository.saveAll(
            listOf(
                TeamMember(TeamMemberId(platformTeamId, enabledMemberId)),
                TeamMember(TeamMemberId(securityTeamId, enabledMemberId)),
                TeamMember(TeamMemberId(disabledOnlyTeamId, disabledMemberId)),
            ),
        )

        return Fixture(
            enabledMemberId = enabledMemberId,
            platformTeamId = platformTeamId,
            securityTeamId = securityTeamId,
            disabledOnlyTeamId = disabledOnlyTeamId,
            emptyTeamId = emptyTeamId,
        )
    }

    private fun saveMember(
        name: String,
        email: String,
        isEnabled: Boolean,
    ): Long =
        checkNotNull(
            memberRepository.save(
                Member(
                    name = name,
                    email = email,
                    password = "$name-password",
                    isEnabled = isEnabled,
                ),
            ).id,
        )

    private fun saveTeam(name: String): Long =
        checkNotNull(teamRepository.save(Team(name = name)).id)
}
