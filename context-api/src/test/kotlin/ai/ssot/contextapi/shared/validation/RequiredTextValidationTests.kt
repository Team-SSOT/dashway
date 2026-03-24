package ai.ssot.contextapi.shared.validation

import ai.ssot.contextapi.domain.member.exception.DuplicateMemberEmailException
import ai.ssot.contextapi.shared.exception.CombinedCustomException
import ai.ssot.contextapi.shared.exception.RequiredFieldException
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith

class RequiredTextValidationTests {
    @Test
    fun `throws a single required field error for blank text`() {
        val exception = assertFailsWith<RequiredFieldException> {
            requireNonBlankText("email", "   ")
        }

        assertEquals("email is required.", exception.message)
    }

    @Test
    fun `collects required field and feature specific validation errors`() {
        val collector = ValidationErrorCollector()
        collector.requireNonBlankText("name", "")
        collector.addIf(condition = true) {
            DuplicateMemberEmailException("alice@example.com")
        }

        val exception = assertFailsWith<CombinedCustomException> {
            collector.throwIfAny()
        }

        assertEquals(
            listOf("name is required.", "Member email already exists."),
            exception.errors.map { it.message },
        )
    }
}
