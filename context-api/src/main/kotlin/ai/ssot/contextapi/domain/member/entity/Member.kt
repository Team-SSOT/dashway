package ai.ssot.contextapi.domain.member.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
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
    @Column(name = "password_hash")
    var passwordHash: String? = null,
    @Column(name = "is_admin", nullable = false)
    var admin: Boolean = false,
    @Column(name = "is_enabled", nullable = false)
    var enabled: Boolean = true,
    @Column(name = "created_datetime", nullable = false)
    var createdDatetime: LocalDateTime = LocalDateTime.now(),
)
