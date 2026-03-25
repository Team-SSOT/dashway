package ai.ssot.contextapi.shared.graphql

import com.netflix.graphql.dgs.DgsComponent
import com.netflix.graphql.dgs.DgsQuery

@DgsComponent
class TestExceptionQuery {
    @DgsQuery
    fun testUnhandledException(): String =
        throw IllegalStateException("Unexpected test exception.")
}
