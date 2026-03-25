package ai.ssot.contextapi.domain.member.service

import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.domain.member.repository.MemberRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

data class MemberLookup(
    val id: Long,
    val name: String,
    val email: String,
    val admin: Boolean,
    val enabled: Boolean,
    val createdDatetime: LocalDateTime,
)

data class MemberAuthLookup(
    val id: Long,
    val name: String,
    val email: String,
    val passwordHash: String?,
    val admin: Boolean,
    val enabled: Boolean,
    val createdDatetime: LocalDateTime,
)

interface MemberLookupService {
    fun findMember(memberId: Long): MemberLookup?
}

interface MemberAuthLookupService {
    fun findById(memberId: Long): MemberAuthLookup?

    fun findByEmail(email: String): MemberAuthLookup?
}

@Service
class DefaultMemberLookupService(
    private val memberRepository: MemberRepository,
) : MemberLookupService, MemberAuthLookupService {
    @Transactional(readOnly = true)
    override fun findMember(memberId: Long): MemberLookup? =
        memberRepository.findById(memberId).orElse(null)?.toLookup()

    @Transactional(readOnly = true)
    override fun findById(memberId: Long): MemberAuthLookup? =
        memberRepository.findById(memberId).orElse(null)?.toAuthLookup()

    @Transactional(readOnly = true)
    override fun findByEmail(email: String): MemberAuthLookup? =
        memberRepository.findByEmail(email)?.toAuthLookup()

    private fun Member.toLookup(): MemberLookup =
        MemberLookup(
            id = checkNotNull(id),
            name = name,
            email = email,
            admin = admin,
            enabled = enabled,
            createdDatetime = createdDatetime,
        )

    private fun Member.toAuthLookup(): MemberAuthLookup =
        MemberAuthLookup(
            id = checkNotNull(id),
            name = name,
            email = email,
            passwordHash = passwordHash,
            admin = admin,
            enabled = enabled,
            createdDatetime = createdDatetime,
        )
}
