package ai.ssot.chat.domain.chat.repository

import ai.ssot.chat.domain.chat.entity.ChatMessage
import org.springframework.data.jpa.repository.JpaRepository

interface ChatMessageRepository : JpaRepository<ChatMessage, Long>
