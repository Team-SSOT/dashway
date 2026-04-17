package com.example.chat.web

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping

@Controller
class SpaController {
    // 확장자 없는 GET 요청을 index.html로 forward.
    // /api/** 는 더 구체적인 REST 컨트롤러 매핑이 우선이므로 영향 없음.
    @GetMapping(
        value = [
            "/{path:[^\\.]*}",
            "/**/{path:[^\\.]*}",
        ],
    )
    fun forward(): String = "forward:/index.html"
}
