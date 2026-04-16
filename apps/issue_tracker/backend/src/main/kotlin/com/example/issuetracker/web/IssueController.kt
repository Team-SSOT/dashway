package com.example.issuetracker.web

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class Issue(val id: Long, val title: String)

@RestController
@RequestMapping("/api/issues")
class IssueController {
    @GetMapping
    fun list(): List<Issue> = listOf(
        Issue(1, "첫 번째 이슈"),
        Issue(2, "두 번째 이슈"),
        Issue(3, "세 번째 이슈"),
    )
}
