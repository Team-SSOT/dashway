package ai.ssot.contextapi

import io.kotest.core.spec.style.BehaviorSpec
import io.kotest.extensions.spring.SpringExtension
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import javax.sql.DataSource

abstract class PostgresBehaviorSpecSupport : BehaviorSpec() {
    @Autowired
    private lateinit var dataSource: DataSource

    @Autowired
    private lateinit var stringRedisTemplate: StringRedisTemplate

    init {
        extension(SpringExtension())
        beforeTest {
            resetState()
        }
    }

    protected fun resetState() {
        resetPersistenceState(dataSource, stringRedisTemplate)
    }

    companion object {
        @JvmStatic
        @DynamicPropertySource
        fun registerDataSourceProperties(registry: DynamicPropertyRegistry) {
            IntegrationTestEnvironment.registerApplicationProperties(registry)
        }
    }
}
