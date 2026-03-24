package ai.ssot.contextapi.shared.page

import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort

object PageSupport {
    private const val MIN_PAGE = 0
    private const val MIN_SIZE = 1
    private const val MAX_SIZE = 100

    fun pageRequest(
        page: Int,
        size: Int,
        sort: Sort = defaultSort(),
    ): PageRequest {
        require(page >= MIN_PAGE) { "page must be 0 or greater." }
        require(size in MIN_SIZE..MAX_SIZE) { "size must be between 1 and 100." }

        return PageRequest.of(page, size, sort)
    }

    fun defaultSort(): Sort =
        Sort.by(
            Sort.Order.desc("createdDatetime"),
            Sort.Order.desc("id"),
        )
}
