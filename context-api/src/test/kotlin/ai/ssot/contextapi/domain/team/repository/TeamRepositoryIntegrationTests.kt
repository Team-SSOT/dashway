package ai.ssot.contextapi.domain.team.repository

import ai.ssot.contextapi.PostgresBehaviorSpecSupport
import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.domain.member.repository.MemberRepository
import ai.ssot.contextapi.domain.team.entity.Team
import ai.ssot.contextapi.domain.team.entity.TeamMember
import ai.ssot.contextapi.domain.team.entity.TeamMemberId
import io.kotest.matchers.shouldBe
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest
class TeamRepositoryIntegrationTests : PostgresBehaviorSpecSupport() {
    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var teamMemberRepository: TeamMemberRepository

    @Autowired
    private lateinit var teamRepository: TeamRepository

    init {
        given("team member repository") {
            `when`("finding memberships by member id") {
                then("returns all team memberships for the member") {
                    val fixture = seedFixture()

                    val memberships = teamMemberRepository.findAllByIdMemberId(fixture.enabledMemberId)

                    memberships.map { it.id.teamId }.toSet() shouldBe setOf(
                        fixture.platformTeamId,
                        fixture.securityTeamId,
                    )
                }
            }

            `when`("getting team id to members") {
                then("returns enabled member projections only") {
                    val fixture = seedFixture()

                    val teamIdToMembers = teamMemberRepository.getTeamIdToMembers(
                        listOf(
                            fixture.platformTeamId,
                            fixture.disabledOnlyTeamId,
                            fixture.emptyTeamId,
                        ),
                    )

                    teamIdToMembers.getValue(fixture.platformTeamId).map { checkNotNull(it.id) } shouldBe listOf(
                        fixture.enabledMemberId,
                    )
                    teamIdToMembers[fixture.disabledOnlyTeamId] shouldBe null
                    teamIdToMembers[fixture.emptyTeamId] shouldBe null
                }
            }

            `when`("checking membership existence by team id") {
                then("distinguishes teams with and without memberships") {
                    val fixture = seedFixture()

                    teamMemberRepository.existsByIdTeamId(fixture.platformTeamId) shouldBe true
                    teamMemberRepository.existsByIdTeamId(fixture.emptyTeamId) shouldBe false
                }
            }
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
