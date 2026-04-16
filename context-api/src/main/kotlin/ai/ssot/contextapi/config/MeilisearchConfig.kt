package ai.ssot.contextapi.config

import com.meilisearch.sdk.Client
import com.meilisearch.sdk.Config
import com.meilisearch.sdk.json.JacksonJsonHandler
import org.springframework.boot.context.properties.ConfigurationProperties
import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@ConfigurationProperties("context-api.search.meilisearch")
data class MeilisearchSearchProperties(
    val host: String,
    val apiKey: String = "",
    val indexName: String = "app_content",
    val connectTimeoutMillis: Int = 3000,
    val readTimeoutMillis: Int = 3000,
)

@Configuration
@EnableConfigurationProperties(MeilisearchSearchProperties::class)
class MeilisearchConfig {
    @Bean
    fun meilisearchClient(
        properties: MeilisearchSearchProperties,
    ): Client =
        Client(
            Config(
                properties.host,
                properties.apiKey,
                JacksonJsonHandler(),
            ),
        )
}
