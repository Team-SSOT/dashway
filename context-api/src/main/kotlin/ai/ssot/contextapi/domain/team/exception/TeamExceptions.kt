package ai.ssot.contextapi.domain.team.exception

import ai.ssot.contextapi.shared.exception.CustomException
import ai.ssot.contextapi.shared.graphql.MutationErrorCode

class TeamNotFoundException(teamId: Long) : CustomException(
    code = MutationErrorCode.NOT_FOUND,
    message = "Team not found.",
)

class TeamNotEmptyException(teamId: Long) : CustomException(
    code = MutationErrorCode.TEAM_NOT_EMPTY,
    message = "Remove all team members before deleting the team.",
)

class MembershipAlreadyExistsException(
    teamId: Long,
    memberId: Long,
) : CustomException(
    code = MutationErrorCode.MEMBERSHIP_ALREADY_EXISTS,
    message = "Member is already assigned to the team.",
)

class MembershipNotFoundException(
    teamId: Long,
    memberId: Long,
) : CustomException(
    code = MutationErrorCode.MEMBERSHIP_NOT_FOUND,
    message = "Member is not assigned to the team.",
)
