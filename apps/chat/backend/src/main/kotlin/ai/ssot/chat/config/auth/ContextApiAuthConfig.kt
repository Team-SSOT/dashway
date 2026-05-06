package ai.ssot.chat.config.auth

import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.client.RestClient

@Configuration
@EnableConfigurationProperties(ContextApiAuthProperties::class)
class ContextApiAuthConfig {
    @Bean
    fun contextApiRestClient(properties: ContextApiAuthProperties): RestClient =
        RestClient.builder()
            .baseUrl(properties.normalizedBaseUrl())
            .build()
}
