package ai.ssot.contextapi.domain.member.exception

import ai.ssot.contextapi.shared.exception.CustomException

class MemberNotFoundException(memberId: Long) : CustomException(
    message = "Member not found.",
)

class DuplicateMemberEmailException(email: String) : CustomException(
    message = "Member email already exists.",
    field = "email",
)
