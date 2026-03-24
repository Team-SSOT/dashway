package ai.ssot.contextapi

import org.junit.jupiter.api.BeforeEach
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.core.io.ClassPathResource
import org.springframework.jdbc.core.JdbcTemplate
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator
import org.springframework.data.redis.core.StringRedisTemplate
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.GenericContainer
import org.testcontainers.containers.PostgreSQLContainer
import javax.sql.DataSource

abstract class PostgresIntegrationTestSupport {
    @Autowired
    private lateinit var dataSource: DataSource

    @Autowired
    private lateinit var stringRedisTemplate: StringRedisTemplate

    @BeforeEach
    fun prepareSchema() {
        ResourceDatabasePopulator(ClassPathResource("db/ddl/ddl.sql")).execute(dataSource)

        val jdbcTemplate = JdbcTemplate(dataSource)
        jdbcTemplate.update("DELETE FROM team_member")
        jdbcTemplate.update("DELETE FROM teams")
        jdbcTemplate.update("DELETE FROM members")
        jdbcTemplate.update("DELETE FROM apps")

        stringRedisTemplate.connectionFactory?.connection?.serverCommands()?.flushAll()
    }

    companion object {
        @JvmStatic
        val postgres: PostgreSQLContainer<Nothing> =
            PostgreSQLContainer<Nothing>("postgres:17-alpine").apply {
                withDatabaseName("context_api")
                withUsername("context_api")
                withPassword("context_api")
            }

        init {
            postgres.start()
        }

        @JvmStatic
        val redis: GenericContainer<Nothing> =
            GenericContainer<Nothing>("redis:7-alpine").apply {
                withExposedPorts(6379)
            }

        init {
            redis.start()
        }

        @JvmStatic
        @DynamicPropertySource
        fun registerDataSourceProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url", postgres::getJdbcUrl)
            registry.add("spring.datasource.username", postgres::getUsername)
            registry.add("spring.datasource.password", postgres::getPassword)
            registry.add("spring.datasource.driver-class-name", postgres::getDriverClassName)
            registry.add("context-api.auth.issuer") { "context-api-test" }
            registry.add("context-api.auth.access-token-ttl") { "PT15M" }
            registry.add("context-api.auth.refresh-token-ttl") { "P7D" }
            registry.add("context-api.auth.jwt-secret") { "0123456789abcdef0123456789abcdef" }
            registry.add("context-api.auth.redis.host", redis::getHost)
            registry.add("context-api.auth.redis.port", redis::getFirstMappedPort)
        }
    }
}
