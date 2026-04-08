package ai.ssot.contextapi.support

import ai.ssot.contextapi.shared.LocalFileStore
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import java.nio.file.Files

@TestConfiguration
class TestFileStorageConfig {
    @Bean
    @Primary
    fun localFileStore(): LocalFileStore {
        val tempRoot = Files.createTempDirectory("context-api-profile-images")
        tempRoot.toFile().deleteOnExit()
        return LocalFileStore(tempRoot)
    }
}
