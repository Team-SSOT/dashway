package ai.ssot.issuetracker.web

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping

@Controller
class SpaController {
    @GetMapping(
        value = [
            "/{path:[^\\.]*}",
            "/**/{path:[^\\.]*}",
        ],
    )
    fun forward(): String = "forward:/index.html"
}
