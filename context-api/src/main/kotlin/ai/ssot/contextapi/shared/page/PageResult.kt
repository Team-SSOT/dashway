package ai.ssot.contextapi.shared.page

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

data class PageResult<T : Any> (
    val contents: List<T>,
    val pageInfo: PageInfo,
) {
    constructor(page: Page<T>) : this(
        contents = page.content,
        pageInfo = PageInfo(
            totalCount = page.totalElements,
            totalPages = page.totalPages,
            pageable = page.pageable,
        ),
    )
}

data class PageInfo(
    val page: Int,
    val size: Int,
    val totalElements: Int,
    val totalPages: Int,
) {
    constructor(totalCount: Long, totalPages: Int, pageable: Pageable): this(
        page = pageable.pageNumber,
        size = pageable.pageSize,
        totalElements = totalCount.toInt(),
        totalPages = totalPages,
    )
}
