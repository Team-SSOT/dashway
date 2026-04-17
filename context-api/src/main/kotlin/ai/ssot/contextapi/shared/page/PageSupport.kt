package ai.ssot.contextapi.shared.page

import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Pageable
import org.springframework.data.domain.Sort

object PageSupport {
    fun pageRequest(
        page: Int,
        size: Int,
    ): Pageable {
        require(page >= 0) { "page must be 0 or greater." }
        require(size in 1..100) { "size must be between 1 and 100." }

        return PageRequest.of(
            page,
            size,
            Sort.by(
                Sort.Order.desc("createdDatetime"),
                Sort.Order.desc("id"),
            ),
        )
    }
}
