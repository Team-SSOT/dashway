package ai.ssot.contextapi.domain.member.service

import ai.ssot.contextapi.domain.member.dto.MemberPage
import ai.ssot.contextapi.domain.member.dto.MemberView
import ai.ssot.contextapi.domain.member.entity.Member
import org.springframework.data.domain.Page

internal fun Page<Member>.toMemberPage(): MemberPage =
    MemberPage(
        items = content.map { it.toView() },
        page = number,
        size = size,
        totalElements = totalElements.toInt(),
        totalPages = totalPages,
    )

internal fun Member.toView(): MemberView =
    MemberView(
        id = checkNotNull(id),
        name = name,
        email = email,
        admin = admin,
        enabled = enabled,
        createdAt = createdDatetime,
    )
