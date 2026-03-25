package ai.ssot.contextapi.domain.team.exception

import ai.ssot.contextapi.shared.exception.CustomException
import ai.ssot.contextapi.shared.exception.ErrorCategory
import ai.ssot.contextapi.shared.exception.ErrorCode

class TeamNotFoundException(teamId: Long) : CustomException(
    code = ErrorCode.NOT_FOUND,
    category = ErrorCategory.NOT_FOUND,
    message = "Team not found.",
)

class TeamNotEmptyException(teamId: Long) : CustomException(
    code = ErrorCode.TEAM_NOT_EMPTY,
    category = ErrorCategory.CONFLICT,
    message = "Remove all team members before deleting the team.",
)

class MembershipAlreadyExistsException(
    teamId: Long,
    memberId: Long,
) : CustomException(
    code = ErrorCode.MEMBERSHIP_ALREADY_EXISTS,
    category = ErrorCategory.CONFLICT,
    message = "Member is already assigned to the team.",
)

class MembershipNotFoundException(
    teamId: Long,
    memberId: Long,
) : CustomException(
    code = ErrorCode.MEMBERSHIP_NOT_FOUND,
    category = ErrorCategory.NOT_FOUND,
    message = "Member is not assigned to the team.",
)
