package ai.ssot.contextapi.domain.storage.service

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class FileTransactionListener(
    private val objectStorage: ObjectStorage,
) {
    private val logger = KotlinLogging.logger { }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onDeletedAfterCommit(event: FileDeletedEvent) {
        runCatching {
            objectStorage.delete(event.storagePath)
        }.onFailure { exception ->
            logger.warn(exception) { "Failed to delete file for storage path ${event.storagePath}." }
        }
    }
}

data class FileDeletedEvent(
    val storagePath: String,
)
