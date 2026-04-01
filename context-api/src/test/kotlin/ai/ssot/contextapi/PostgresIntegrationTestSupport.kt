package ai.ssot.contextapi

import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.io.ClassPathResource
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.datasource.SingleConnectionDataSource
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.GenericContainer
import org.testcontainers.containers.PostgreSQLContainer
import javax.sql.DataSource

internal fun resetPersistenceState(
    dataSource: DataSource,
    stringRedisTemplate: StringRedisTemplate,
) {
    val jdbcTemplate = JdbcTemplate(dataSource)
    jdbcTemplate.execute(
        "TRUNCATE TABLE team_member, member_authorities, teams, members, apps RESTART IDENTITY CASCADE"
    )
    stringRedisTemplate.execute { connection ->
        connection.serverCommands().flushDb()
        null
    }
}

internal object IntegrationTestEnvironment {
    private val postgres: PostgreSQLContainer<Nothing> by lazy {
        PostgreSQLContainer<Nothing>("postgres:17-alpine").apply {
            withDatabaseName("context_api")
            withUsername("context_api")
            withPassword("context_api")
            start()
        }
            .also(::initializeSchema)
    }

    private val redis: GenericContainer<Nothing> by lazy {
        GenericContainer<Nothing>("redis:7-alpine").apply {
            withExposedPorts(6379)
            start()
        }
    }

    fun registerDataSourceProperties(registry: DynamicPropertyRegistry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl)
        registry.add("spring.datasource.username", postgres::getUsername)
        registry.add("spring.datasource.password", postgres::getPassword)
        registry.add("spring.datasource.driver-class-name", postgres::getDriverClassName)
    }

    fun registerApplicationProperties(registry: DynamicPropertyRegistry) {
        registerDataSourceProperties(registry)
        registry.add("context-api.auth.issuer") { "context-api-test" }
        registry.add("context-api.auth.access-token-ttl") { "900" }
        registry.add("context-api.auth.refresh-token-ttl") { "604800" }
        registry.add("context-api.auth.jwt-secret") { "0123456789abcdef0123456789abcdef" }
        registry.add("redis.host", redis::getHost)
        registry.add("redis.port", redis::getFirstMappedPort)
    }

    private fun initializeSchema(postgres: PostgreSQLContainer<Nothing>) {
        val dataSource = SingleConnectionDataSource(
            postgres.jdbcUrl,
            postgres.username,
            postgres.password,
            true,
        )
        try {
            ResourceDatabasePopulator(ClassPathResource("db/ddl/ddl.sql")).execute(dataSource)
        } finally {
            dataSource.destroy()
        }
    }
}

abstract class PostgresIntegrationTestSupport {
    @Autowired
    private lateinit var dataSource: DataSource

    @Autowired
    private lateinit var stringRedisTemplate: StringRedisTemplate

    @BeforeEach
    fun prepareSchema() {
        resetState()
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
