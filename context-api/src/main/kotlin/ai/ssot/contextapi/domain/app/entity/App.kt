package ai.ssot.contextapi.domain.app.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "apps")
class App(
    @Id
    @Column(nullable = false)
    var id: UUID = UUID.randomUUID(),
    @Column(nullable = false)
    var name: String = "",
    @Column(nullable = false)
    var port: Int,
    @Column(name = "is_enabled", nullable = false)
    var isEnabled: Boolean = true,
    @Column(name = "created_datetime", nullable = false)
    var createdDatetime: LocalDateTime = LocalDateTime.now(),
)
