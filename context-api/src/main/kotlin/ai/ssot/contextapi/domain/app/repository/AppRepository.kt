package ai.ssot.contextapi.domain.app.repository

import ai.ssot.contextapi.domain.app.entity.App
import ai.ssot.contextapi.domain.app.entity.QApp.Companion.app
import com.querydsl.jpa.impl.JPAQueryFactory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.UUID

interface AppRepository : JpaRepository<App, UUID>, QAppRepository

interface QAppRepository {
    fun updateIsEnabled(id: UUID, isEnabled: Boolean): Long
}

@Repository
class QAppRepositoryImpl(private val queryFactory: JPAQueryFactory): QAppRepository {

    override fun updateIsEnabled(id: UUID, isEnabled: Boolean): Long {
        return queryFactory.update(app)
            .set(app.isEnabled, isEnabled)
            .where(app.id.eq(id))
            .execute()
    }
}
