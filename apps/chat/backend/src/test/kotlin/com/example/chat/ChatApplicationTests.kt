package ai.ssot.chat

import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest

@SpringBootTest(
    properties = ["spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect"],
)
class ChatApplicationTests {

    @Test
    fun contextLoads() {
    }

}
