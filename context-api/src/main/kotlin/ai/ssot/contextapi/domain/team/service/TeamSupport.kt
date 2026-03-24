package ai.ssot.contextapi.domain.team.service

import ai.ssot.contextapi.domain.member.service.MemberLookup
import ai.ssot.contextapi.domain.team.dto.MemberPage
import ai.ssot.contextapi.domain.team.dto.TeamMemberView
import ai.ssot.contextapi.domain.team.dto.TeamPage
import ai.ssot.contextapi.domain.team.dto.TeamView
import ai.ssot.contextapi.domain.team.entity.Team
import ai.ssot.contextapi.domain.team.repository.TeamMemberSummaryProjection
import org.springframework.data.domain.Page

internal fun Page<Team>.toTeamPage(): TeamPage =
    TeamPage(
        items = content.map { it.toView() },
        page = number,
        size = size,
        totalElements = totalElements.toInt(),
        totalPages = totalPages,
    )

internal fun Page<TeamMemberSummaryProjection>.toMemberPage(): MemberPage =
    MemberPage(
        items = content.map { it.toView() },
        page = number,
        size = size,
        totalElements = totalElements.toInt(),
        totalPages = totalPages,
    )

internal fun Team.toView(): TeamView =
    TeamView(
        id = checkNotNull(id),
        name = name,
        createdAt = createdDatetime,
    )

internal fun MemberLookup.toTeamMemberView(): TeamMemberView =
    TeamMemberView(
        id = id,
        name = name,
        email = email,
        admin = admin,
        enabled = enabled,
        createdAt = createdAt,
    )

internal fun TeamMemberSummaryProjection.toView(): TeamMemberView =
    TeamMemberView(
        id = id,
        name = name,
        email = email,
        admin = admin,
        enabled = enabled,
        createdAt = createdAt,
    )
