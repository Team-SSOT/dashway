package ai.ssot.contextapi.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.data.elasticsearch.client.ClientConfiguration
import org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories

@Configuration
@EnableElasticsearchRepositories
class ElasticsearchConfig: ElasticsearchConfiguration() {

    @Value("\${spring.elasticsearch.url}")
    val url: String = "http://localhost:9200"

    override fun clientConfiguration(): ClientConfiguration {
        return ClientConfiguration.builder()
            .connectedTo(url)
            .withConnectTimeout(3000)
            .build()
    }
}