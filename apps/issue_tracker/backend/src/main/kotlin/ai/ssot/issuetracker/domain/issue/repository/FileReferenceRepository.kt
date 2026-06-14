package ai.ssot.issuetracker.domain.issue.repository

import jakarta.persistence.EntityManager
import org.springframework.stereotype.Repository
import java.util.UUID

interface FileReferenceRepository {
    fun countExisting(fileIds: Collection<UUID>): Long
}

@Repository
class FileReferenceRepositoryImpl(
    private val entityManager: EntityManager,
) : FileReferenceRepository {
    override fun countExisting(fileIds: Collection<UUID>): Long {
        if (fileIds.isEmpty()) {
            return 0
        }

        return (entityManager.createNativeQuery(
            """
            SELECT COUNT(*)
            FROM files
            WHERE id IN (:fileIds)
            """.trimIndent(),
        )
            .setParameter("fileIds", fileIds)
            .singleResult as Number).toLong()
    }
}
