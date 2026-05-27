package ai.ssot.contextapi.domain.storage.controller

import ai.ssot.contextapi.domain.storage.dto.FilePageResponse
import ai.ssot.contextapi.domain.storage.dto.FileResponse
import ai.ssot.contextapi.domain.storage.service.FileService
import org.springframework.core.io.Resource
import org.springframework.http.*
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import java.nio.charset.StandardCharsets
import java.util.concurrent.TimeUnit

@RestController
@RequestMapping("/files")
class FileController(
    private val fileService: FileService,
) {
    @PostMapping(consumes = [MediaType.MULTIPART_FORM_DATA_VALUE],)
    fun upload(
        @RequestPart("file") file: MultipartFile,
    ): FileResponse =
        fileService.upload(file = file)

    @GetMapping("/{id}")
    fun download(
        @PathVariable id: String,
    ): ResponseEntity<Resource> {
        val download = fileService.download(id)
        val file = download.file
        val storedObject = download.storedObjectResource

        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(file.contentType))
            .contentLength(storedObject.contentLength)
            .header(HttpHeaders.ETAG, "\"${file.checksumSha256}\"")
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment()
                    .filename(file.fileName, StandardCharsets.UTF_8)
                    .build()
                    .toString(),
            )
            .header("X-Content-Type-Options", "nosniff")
            .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePrivate())
            .body(storedObject.resource)
    }

    @DeleteMapping("/{id}")
    fun delete(
        @PathVariable id: String,
    ): ResponseEntity<Void> {
        fileService.delete(id)
        return ResponseEntity.noContent().build()
    }

    @GetMapping
    fun list(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): FilePageResponse =
        fileService.list(
            page = page,
            size = size,
        )
}
