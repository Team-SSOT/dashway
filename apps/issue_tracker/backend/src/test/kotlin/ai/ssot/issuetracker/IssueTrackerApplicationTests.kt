package ai.ssot.issuetracker

import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest(
    properties = ["spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect"],
)
class IssueTrackerApplicationTests {

    @Test
    fun contextLoads() {
    }
}
