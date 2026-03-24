package ai.ssot.contextapi.domain.app.repository

import ai.ssot.contextapi.domain.app.entity.App
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface AppRepository : JpaRepository<App, UUID>
