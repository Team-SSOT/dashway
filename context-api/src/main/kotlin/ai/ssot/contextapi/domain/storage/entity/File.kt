package ai.ssot.contextapi.domain.storage.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.LocalDateTime
import java.util.*

@Entity
@Table(name = "files")
class File(
    @Id
    @Column(nullable = false)
    var id: UUID = UUID.randomUUID(),

    @Column(name = "file_name", nullable = false)
    var fileName: String = "",

    @Column(name = "storage_path", nullable = false, unique = true)
    var storagePath: String = "",

    @Column(name = "owner_member_id", nullable = false)
    var ownerMemberId: Long = 0,

    @Column(name = "content_type", nullable = false)
    var contentType: String = "",

    @Column(name = "content_length", nullable = false)
    var contentLength: Long = 0,

    @Column(name = "checksum_sha256", nullable = false)
    var checksumSha256: String = "",

    @Column(name = "created_datetime", nullable = false)
    var createdDatetime: LocalDateTime = LocalDateTime.now(),
)
