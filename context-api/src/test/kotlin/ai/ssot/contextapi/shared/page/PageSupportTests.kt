package ai.ssot.contextapi.shared.page

import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class PageSupportTests {
    @Test
    fun `creates the default page request`() {
        val pageRequest = PageSupport.pageRequest(page = 2, size = 25)

        assertEquals(2, pageRequest.pageNumber)
        assertEquals(25, pageRequest.pageSize)
        assertEquals("createdDatetime: DESC,id: DESC", pageRequest.sort.toString())
    }

    @Test
    fun `rejects invalid page and size values`() {
        val invalidPage = assertFailsWith<IllegalArgumentException> {
            PageSupport.pageRequest(page = -1, size = 10)
        }
        val invalidSize = assertFailsWith<IllegalArgumentException> {
            PageSupport.pageRequest(page = 0, size = 101)
        }

        assertEquals("page must be 0 or greater.", invalidPage.message)
        assertEquals("size must be between 1 and 100.", invalidSize.message)
    }
}
