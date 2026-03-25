package ai.ssot.contextapi.domain.member.exception

import ai.ssot.contextapi.shared.exception.CustomException
import ai.ssot.contextapi.shared.exception.ErrorCategory
import ai.ssot.contextapi.shared.exception.ErrorCode

class MemberNotFoundException(memberId: Long) : CustomException(
    code = ErrorCode.NOT_FOUND,
    category = ErrorCategory.NOT_FOUND,
    message = "Member not found.",
)

class DuplicateMemberEmailException(email: String) : CustomException(
    code = ErrorCode.DUPLICATE_MEMBER_EMAIL,
    category = ErrorCategory.CONFLICT,
    message = "Member email already exists.",
    field = "email",
)
