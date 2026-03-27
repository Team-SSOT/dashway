package ai.ssot.contextapi.domain.team.repository

import ai.ssot.contextapi.PostgresIntegrationTestSupport
import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.domain.member.repository.MemberRepository
import ai.ssot.contextapi.domain.team.entity.Team
import ai.ssot.contextapi.domain.team.entity.TeamMember
import ai.ssot.contextapi.domain.team.entity.TeamMemberId
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.data.domain.PageRequest
import kotlin.test.assertEquals
import kotlin.test.assertTrue

@SpringBootTest
class TeamRepositoryIntegrationTests : PostgresIntegrationTestSupport() {
    @Autowired
    private lateinit var memberRepository: MemberRepository

    @Autowired
    private lateinit var teamMemberRepository: TeamMemberRepository

    @Autowired
    private lateinit var teamRepository: TeamRepository

    @Test
    fun `finds memberships by member id and member projections by team id`() {
        val member1 = memberRepository.save(
            Member(
                name = "member-1",
                email = "member-1@example.com",
                password = "member-1-password",
            ),
        )
        val member2 = memberRepository.save(
            Member(
                name = "member-2",
                email = "member-2@example.com",
                password = "member-2-password",
            ),
        )
        teamRepository.saveAll(
            listOf(
                Team(name = "team-10"),
                Team(name = "team-20"),
                Team(name = "team-30"),
            ),
        )
        val teams = teamRepository.findAll().sortedBy { it.id }
        teamMemberRepository.saveAll(
            listOf(
                TeamMember(TeamMemberId(checkNotNull(teams[0].id), checkNotNull(member1.id))),
                TeamMember(TeamMemberId(checkNotNull(teams[1].id), checkNotNull(member1.id))),
                TeamMember(TeamMemberId(checkNotNull(teams[2].id), checkNotNull(member2.id))),
            ),
        )

        val memberships = teamMemberRepository.findAllByIdMemberId(checkNotNull(member1.id))
        val teamMembers = teamMemberRepository.findMemberSummariesByTeamId(checkNotNull(teams[0].id), PageRequest.of(0, 10))

        assertEquals(setOf(checkNotNull(teams[0].id), checkNotNull(teams[1].id)), memberships.map { it.id.teamId }.toSet())
        assertEquals(listOf(checkNotNull(member1.id)), teamMembers.content.map { it.id })
        assertTrue(teamMemberRepository.existsByIdTeamId(checkNotNull(teams[0].id)))
    }
}
