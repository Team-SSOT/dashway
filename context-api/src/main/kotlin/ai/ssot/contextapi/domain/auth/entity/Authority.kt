package ai.ssot.contextapi.domain.auth.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "authorities")
class Authority(
    @Id
    @Column(nullable = false)
    var id: Int? = null,

    @Column(nullable = false)
    var name: String,
)
