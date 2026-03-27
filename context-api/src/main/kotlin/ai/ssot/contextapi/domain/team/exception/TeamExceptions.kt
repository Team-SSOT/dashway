package ai.ssot.contextapi.domain.team.exception

import ai.ssot.contextapi.shared.exception.CustomException

class TeamNotFoundException(teamId: Long) : CustomException(
    message = "Team($teamId) not found.",
)

class TeamNotEmptyException(teamId: Long) : CustomException(
    message = "Remove all team members before deleting the team($teamId).",
)

class MembershipAlreadyExistsException(
    teamId: Long,
    memberId: Long,
) : CustomException(
    message = "Member($memberId) is already assigned to the team($teamId).",
)

class TeamMemberNotFoundException(
    teamId: Long,
    memberId: Long,
) : CustomException(
    message = "Member($memberId) is not assigned to the team($teamId).",
)
