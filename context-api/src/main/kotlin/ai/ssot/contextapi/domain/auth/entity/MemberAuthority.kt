package ai.ssot.contextapi.domain.auth.entity

import jakarta.persistence.*
import java.io.Serializable

@Embeddable
data class MemberAuthorityId(
    @Column(name = "member_id", nullable = false)
    var memberId: Long = 0,

    @Column(name = "authority_id", nullable = false)
    var authorityId: Int = 0,
) : Serializable

@Entity
@Table(name = "member_authorities")
class MemberAuthority(
    @EmbeddedId
    var id: MemberAuthorityId = MemberAuthorityId(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "authority_id", referencedColumnName = "id", insertable = false, updatable = false)
    var authority: Authority? = null,
)
