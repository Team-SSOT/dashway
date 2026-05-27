package ai.ssot.contextapi.domain.storage.service

import org.springframework.core.io.Resource
import java.io.InputStream

data class StoredObject(
    val contentLength: Long,
    val checksumSha256: String,
)

data class StoredObjectResource(
    val resource: Resource,
    val contentLength: Long,
)

interface ObjectStorage {
    fun save(storagePath: String, inputStream: InputStream): StoredObject

    fun load(storagePath: String): StoredObjectResource

    fun delete(storagePath: String)
}
