package ai.ssot.issuetracker.domain.issue.repository

import ai.ssot.issuetracker.domain.issue.entity.Label
import org.springframework.data.jpa.repository.JpaRepository

interface LabelRepository : JpaRepository<Label, Long> {
    fun existsByProjectIdAndName(projectId: Long, name: String): Boolean

    fun findByIdAndProjectId(id: Long, projectId: Long): Label?

    fun findAllByProjectIdOrderByNameAscIdAsc(projectId: Long): List<Label>

    fun findAllByProjectIdAndIdIn(projectId: Long, ids: Collection<Long>): List<Label>
}
