package ai.ssot.contextapi.infrastructure.elasticsearch

import ai.ssot.contextapi.generated.types.SourceType
import jakarta.persistence.Id
import org.springframework.data.elasticsearch.annotations.Document
import org.springframework.data.elasticsearch.annotations.Field

@Document(indexName = "app_content")
class AppContentDocument(
    @Id
    @Field(name = "id")
    val id: String,

    @Field(name = "source_type")
    val source: SourceType,

    @Field(name = "source_id")
    val sourceId: String,

    @Field(name = "title")
    val title: String,

    @Field(name = "content")
    val content: String,

    @Field(name = "raw_payload")
    val rawPayload: String,

    @Field(name = "created_datetime")
    val createdDatetime: String,
)