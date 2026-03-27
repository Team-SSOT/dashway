package ai.ssot.contextapi.domain.member.entity

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "members")
class Member(

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    var id: Long? = null,

    @Column(nullable = false)
    var name: String = "",

    @Column(nullable = false, unique = true)
    var email: String = "",

    @Column(name = "password")
    var password: String? = null,

    @Column(name = "is_admin", nullable = false)
    var isAdmin: Boolean = false,

    @Column(name = "is_enabled", nullable = false)
    var isEnabled: Boolean = true,

    @Column(name = "created_datetime", nullable = false)
    var createdDatetime: LocalDateTime = LocalDateTime.now(),
)
