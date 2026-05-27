package ai.ssot.contextapi.domain.storage.repository

import ai.ssot.contextapi.domain.storage.entity.File
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.*

@Repository
interface FileRepository : JpaRepository<File, UUID> {
    fun findByOwnerMemberId(ownerMemberId: Long, pageable: Pageable): Page<File>
}
