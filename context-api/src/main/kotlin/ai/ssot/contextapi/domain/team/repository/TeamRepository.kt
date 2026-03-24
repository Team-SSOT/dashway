package ai.ssot.contextapi.domain.team.repository

import ai.ssot.contextapi.domain.team.entity.Team
import org.springframework.data.jpa.repository.JpaRepository

interface TeamRepository : JpaRepository<Team, Long>
