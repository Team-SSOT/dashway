package ai.ssot.contextapi.shared.page

data class PageInfo(
    val page: Int,
    val size: Int,
    val totalElements: Int,
    val totalPages: Int,
)
