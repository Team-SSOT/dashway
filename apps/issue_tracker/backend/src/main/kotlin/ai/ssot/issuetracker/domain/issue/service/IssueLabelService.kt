package ai.ssot.issuetracker.domain.issue.service

import ai.ssot.issuetracker.domain.issue.dto.CreateLabelDto
import ai.ssot.issuetracker.domain.issue.dto.DeleteLabelDto
import ai.ssot.issuetracker.domain.issue.dto.LabelDto
import ai.ssot.issuetracker.domain.issue.dto.UpdateLabelDto
import ai.ssot.issuetracker.domain.issue.dto.toDto
import ai.ssot.issuetracker.domain.issue.entity.IssueLabel
import ai.ssot.issuetracker.domain.issue.entity.IssueLabelId
import ai.ssot.issuetracker.domain.issue.entity.Label
import ai.ssot.issuetracker.domain.issue.exception.InvalidIssueRequestException
import ai.ssot.issuetracker.domain.issue.repository.IssueLabelRepository
import ai.ssot.issuetracker.domain.issue.repository.LabelRepository
import ai.ssot.issuetracker.domain.project.service.ProjectMemberService
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime

@Service
class IssueLabelService(
    private val projectMemberService: ProjectMemberService,
    private val labelRepository: LabelRepository,
    private val issueLabelRepository: IssueLabelRepository,
) {
    @Transactional
    fun createLabel(memberId: Long, dto: CreateLabelDto): LabelDto {
        projectMemberService.validateProjectMember(dto.projectId, memberId)
        val name = normalizeLabelName(dto.name)
        val color = normalizeColor(dto.color)

        if (labelRepository.existsByProjectIdAndName(dto.projectId, name)) {
            throw InvalidIssueRequestException("Label name already exists in the project.")
        }

        val now = OffsetDateTime.now()
        return labelRepository.saveAndFlush(
            Label(
                projectId = dto.projectId,
                name = name,
                color = color,
                createdDatetime = now,
                updatedDatetime = now,
            ),
        ).toDto()
    }

    @Transactional
    fun updateLabel(memberId: Long, dto: UpdateLabelDto): LabelDto {
        val label = labelRepository.findById(dto.labelId)
            .orElseThrow { InvalidIssueRequestException("Label not found.") }
        projectMemberService.validateProjectMember(label.projectId, memberId)

        dto.name?.let { rawName ->
            val name = normalizeLabelName(rawName)
            if (name != label.name && labelRepository.existsByProjectIdAndName(label.projectId, name)) {
                throw InvalidIssueRequestException("Label name already exists in the project.")
            }
            label.name = name
        }
        dto.color?.let { label.color = normalizeColor(it) }
        label.updatedDatetime = OffsetDateTime.now()
        return label.toDto()
    }

    @Transactional
    fun deleteLabel(memberId: Long, dto: DeleteLabelDto): Boolean {
        val label = labelRepository.findById(dto.labelId)
            .orElseThrow { InvalidIssueRequestException("Label not found.") }
        projectMemberService.validateProjectMember(label.projectId, memberId)
        issueLabelRepository.deleteAllByIdLabelId(dto.labelId)
        labelRepository.delete(label)
        return true
    }

    @Transactional(readOnly = true)
    fun getLabels(memberId: Long, projectId: Long): List<LabelDto> {
        projectMemberService.validateProjectMember(projectId, memberId)
        return labelRepository.findAllByProjectIdOrderByNameAscIdAsc(projectId).map { it.toDto() }
    }

    @Transactional(readOnly = true)
    fun validateLabelIds(projectId: Long, labelIds: Collection<Long>): List<LabelDto> {
        val distinctLabelIds = labelIds.distinct()
        if (distinctLabelIds.size != labelIds.size) {
            throw InvalidIssueRequestException("labelIds must not contain duplicates.")
        }
        if (distinctLabelIds.isEmpty()) {
            return emptyList()
        }

        val labels = labelRepository.findAllByProjectIdAndIdIn(projectId, distinctLabelIds)
        val foundIds = labels.map { requireNotNull(it.id) }.toSet()
        val missingIds = distinctLabelIds.filterNot(foundIds::contains)
        if (missingIds.isNotEmpty()) {
            throw InvalidIssueRequestException("Labels not found in the project: ${missingIds.joinToString(", ")}.")
        }
        return labels.map { it.toDto() }
    }

    @Transactional
    fun replaceIssueLabels(issueId: Long, projectId: Long, labelIds: Collection<Long>) {
        val labels = validateLabelIds(projectId, labelIds)
        issueLabelRepository.deleteAllByIdIssueId(issueId)
        issueLabelRepository.saveAllAndFlush(
            labels.map { label ->
                IssueLabel(
                    id = IssueLabelId(issueId = issueId, labelId = label.id),
                    createdDatetime = OffsetDateTime.now(),
                )
            },
        )
    }

    @Transactional(readOnly = true)
    fun getLabelsByIssueIds(issueIds: Collection<Long>): Map<Long, List<LabelDto>> {
        if (issueIds.isEmpty()) {
            return emptyMap()
        }

        val issueLabels = issueLabelRepository.findAllByIdIssueIdIn(issueIds)
        val labelsById = labelRepository.findAllById(issueLabels.map { it.id.labelId }.distinct())
            .associateBy { requireNotNull(it.id) }

        return issueLabels
            .groupBy { it.id.issueId }
            .mapValues { (_, rows) ->
                rows.mapNotNull { labelsById[it.id.labelId]?.toDto() }
                    .sortedWith(compareBy<LabelDto> { it.name }.thenBy { it.id })
            }
    }

    private fun normalizeLabelName(rawName: String): String {
        val name = rawName.trim()
        if (name.isEmpty()) {
            throw InvalidIssueRequestException("Label name is required.")
        }
        return name
    }

    private fun normalizeColor(rawColor: String): String {
        val color = rawColor.trim()
        if (color.isEmpty()) {
            throw InvalidIssueRequestException("Label color is required.")
        }
        return color
    }
}
