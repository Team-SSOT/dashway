package ai.ssot.contextapi.domain.member.service

data class MemberProfileImageDeletedEvent(
    val oldPath: String,
)

data class MemberProfileImageReplacedEvent(
    val oldPath: String?,
    val newPath: String,
)
