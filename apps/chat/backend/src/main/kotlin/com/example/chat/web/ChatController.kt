package com.example.chat.web

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class Message(val id: Long, val author: String, val content: String)

@RestController
@RequestMapping("/api/messages")
class ChatController {
    @GetMapping
    fun list(): List<Message> = listOf(
        Message(1, "Alice", "안녕하세요!"),
        Message(2, "Bob", "반가워요 :)"),
        Message(3, "Alice", "오늘 회의 몇 시인가요?"),
    )
}
