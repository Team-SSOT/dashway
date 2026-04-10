package ai.ssot.contextapi

import ai.ssot.contextapi.infrastructure.elasticsearch.AppContentDocument
import org.springframework.data.elasticsearch.core.ElasticsearchOperations
import org.springframework.data.elasticsearch.core.document.Document
import org.springframework.test.context.DynamicPropertyRegistry
import org.testcontainers.containers.GenericContainer
import org.testcontainers.containers.wait.strategy.Wait
import java.time.Duration

internal object ElasticsearchIntegrationTestEnvironment {
    private const val ELASTICSEARCH_PORT = 9200

    private val elasticsearch: GenericContainer<Nothing> by lazy {
        GenericContainer<Nothing>("docker.elastic.co/elasticsearch/elasticsearch:9.3.3").apply {
            withEnv("discovery.type", "single-node")
            withEnv("network.host", "0.0.0.0")
            withEnv("http.host", "0.0.0.0")
            withEnv("xpack.security.enabled", "false")
            withEnv("ES_JAVA_OPTS", "-Xms256m -Xmx256m")
            withExposedPorts(ELASTICSEARCH_PORT)
            waitingFor(
                Wait.forListeningPort()
                    .withStartupTimeout(Duration.ofMinutes(3)),
            )
            start()
        }
    }

    fun registerProperties(registry: DynamicPropertyRegistry) {
        registry.add("spring.elasticsearch.url") {
            "${elasticsearch.host}:${elasticsearch.getMappedPort(ELASTICSEARCH_PORT)}"
        }
    }
}

internal fun resetElasticsearchState(elasticsearchOperations: ElasticsearchOperations) {
    val indexOperations = elasticsearchOperations.indexOps(AppContentDocument::class.java)
    if (indexOperations.exists()) {
        indexOperations.delete()
    }
    indexOperations.create()
    indexOperations.putMapping(
        Document.parse(
            """
            {
              "properties": {
                "id": { "type": "keyword" },
                "source_type": { "type": "keyword" },
                "source_id": { "type": "keyword" },
                "title": { "type": "text" },
                "content": { "type": "text" },
                "raw_payload": { "type": "text" },
                "created_datetime": { "type": "keyword" }
              }
            }
            """.trimIndent(),
        ),
    )
    indexOperations.refresh()
}
