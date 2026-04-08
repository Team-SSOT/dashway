package ai.ssot.contextapi.domain.member.service

import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionPhase
import org.springframework.transaction.event.TransactionalEventListener

@Component
class MemberProfileImageTransactionListener(
    private val memberProfileImageService: MemberProfileImageService,
) {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onDeleted(event: MemberProfileImageDeletedEvent) {
        memberProfileImageService.cleanupQuietly(event.oldPath, "delete profile image")
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    fun onReplacedAfterCommit(event: MemberProfileImageReplacedEvent) {
        event.oldPath?.let {
            memberProfileImageService.cleanupQuietly(it, "delete replaced image")
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_ROLLBACK)
    fun onReplacedAfterRollback(event: MemberProfileImageReplacedEvent) {
        memberProfileImageService.cleanupQuietly(event.newPath, "rollback replacement")
    }
}
