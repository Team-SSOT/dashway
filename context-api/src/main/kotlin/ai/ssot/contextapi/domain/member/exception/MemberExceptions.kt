package ai.ssot.contextapi.domain.member.exception

import ai.ssot.contextapi.shared.exception.CustomException
import ai.ssot.contextapi.shared.graphql.MutationErrorCode

class MemberNotFoundException(memberId: Long) : CustomException(
    code = MutationErrorCode.NOT_FOUND,
    message = "Member not found.",
)

class DuplicateMemberEmailException(email: String) : CustomException(
    code = MutationErrorCode.DUPLICATE_MEMBER_EMAIL,
    message = "Member email already exists.",
)
