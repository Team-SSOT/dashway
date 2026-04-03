package ai.ssot.contextapi.domain.install.service

import ai.ssot.contextapi.domain.app.entity.App
import ai.ssot.contextapi.domain.app.repository.AppRepository
import ai.ssot.contextapi.domain.auth.entity.MemberAuthority
import ai.ssot.contextapi.domain.auth.entity.MemberAuthorityId
import ai.ssot.contextapi.domain.auth.repository.MemberAuthorityRepository
import ai.ssot.contextapi.domain.install.dto.InstallAppRequest
import ai.ssot.contextapi.domain.install.dto.InstallBootstrapRequest
import ai.ssot.contextapi.domain.install.dto.InstallBootstrapResponse
import ai.ssot.contextapi.domain.install.exception.InstallBootstrapBadRequestException
import ai.ssot.contextapi.domain.install.exception.InstallBootstrapConflictException
import ai.ssot.contextapi.domain.member.entity.Member
import ai.ssot.contextapi.domain.member.repository.MemberRepository
import ai.ssot.contextapi.domain.member.service.MemberService
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.UUID

@Service
class InstallBootstrapService(
    private val appRepository: AppRepository,
    private val memberAuthorityRepository: MemberAuthorityRepository,
    private val memberRepository: MemberRepository,
    private val memberService: MemberService,
    private val passwordEncoder: PasswordEncoder,
) {
    @Transactional
    fun bootstrap(request: InstallBootstrapRequest): InstallBootstrapResponse {
        val normalizedName = request.admin.name.trim()
        val normalizedEmail = request.admin.email.trim()
        val encodedPassword = requireNotNull(passwordEncoder.encode(request.admin.password)) {
            "Failed to encode bootstrap admin password."
        }

        val adminResult = upsertAdmin(
            name = normalizedName,
            email = normalizedEmail,
            encodedPassword = encodedPassword,
        )
        val enabledAppIds = syncApps(
            apps = request.apps,
            selectedAppIds = request.selectedAppIds.distinct(),
        )

        return InstallBootstrapResponse(
            adminCreated = adminResult.created,
            adminEmail = normalizedEmail,
            syncedAppCount = request.apps.size,
            enabledAppIds = enabledAppIds,
        )
    }

    private fun upsertAdmin(
        name: String,
        email: String,
        encodedPassword: String,
    ): AdminUpsertResult {
        val adminMemberIds = memberAuthorityRepository.findAllByIdAuthorityId(ADMIN_AUTHORITY_ID)
            .map { it.id.memberId }
            .distinct()
        val adminMembers = if (adminMemberIds.isEmpty()) {
            emptyList()
        } else {
            memberRepository.findAllById(adminMemberIds)
        }

        if (adminMembers.isNotEmpty() && adminMembers.none { it.email == email }) {
            throw InstallBootstrapConflictException(
                "An admin account already exists for ${adminMembers.first().email}.",
            )
        }

        val existingMember = memberRepository.findByEmail(email)
        val member = if (existingMember != null) {
            existingMember.apply {
                this.name = name
                this.password = encodedPassword
                this.isEnabled = true
            }.let(memberRepository::save)
        } else {
            memberService.create(
                name = name,
                email = email,
                password = encodedPassword,
                isEnabled = true,
            )
        }

        ensureAdminAuthority(checkNotNull(member.id))

        return AdminUpsertResult(
            member = member,
            created = existingMember == null,
        )
    }

    private fun ensureAdminAuthority(memberId: Long) {
        val memberAuthorityId = MemberAuthorityId(
            memberId = memberId,
            authorityId = ADMIN_AUTHORITY_ID,
        )
        if (!memberAuthorityRepository.existsById(memberAuthorityId)) {
            memberAuthorityRepository.save(
                MemberAuthority(id = memberAuthorityId),
            )
        }
    }

    private fun syncApps(
        apps: List<InstallAppRequest>,
        selectedAppIds: List<String>,
    ): List<String> {
        val enabledAppIds = selectedAppIds.toSet()
        apps.forEach { appRequest ->
            val appId = parseAppId(appRequest.id)
            val normalizedName = appRequest.name.trim()
            val enabled = enabledAppIds.contains(appRequest.id)

            val app = appRepository.findById(appId)
                .orElse(
                    App(
                        id = appId,
                        name = normalizedName,
                        port = appRequest.port,
                        isEnabled = enabled,
                    ),
                )

            app.name = normalizedName
            app.port = appRequest.port
            app.isEnabled = enabled

            appRepository.save(app)
        }

        return apps.map { it.id }
            .filter(enabledAppIds::contains)
            .sorted()
    }

    private fun parseAppId(rawId: String): UUID {
        return runCatching { UUID.fromString(rawId) }
            .getOrElse {
                throw InstallBootstrapBadRequestException("App id \"$rawId\" must be a valid UUID.")
            }
    }

    private data class AdminUpsertResult(
        val member: Member,
        val created: Boolean,
    )

    private companion object {
        // ddl.sql seeds ADMIN as authority id 1.
        const val ADMIN_AUTHORITY_ID = 1
    }
}
