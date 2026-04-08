package ai.ssot.contextapi.domain.member.controller

import ai.ssot.contextapi.domain.member.service.MemberService
import org.springframework.core.io.Resource
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.MediaTypeFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/members")
class MemberProfileImageController(
    private val memberService: MemberService,
) {
    @GetMapping("/{memberId}/profile/{fileName}")
    fun profileImage(
        @PathVariable memberId: Long,
        @PathVariable fileName: String,
    ): ResponseEntity<Resource> {
        return memberService.getProfileImage(memberId, fileName)
            ?.let {
                ResponseEntity.ok()
                    .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL)
                    .contentType(MediaTypeFactory.getMediaType(it.fileName).orElse(MediaType.APPLICATION_OCTET_STREAM))
                    .contentLength(it.contentLength)
                    .body(it.resource)
            }
            ?: ResponseEntity.notFound().build()
    }

    companion object {
        private const val CACHE_CONTROL = "private, max-age=31536000, immutable"
    }
}
