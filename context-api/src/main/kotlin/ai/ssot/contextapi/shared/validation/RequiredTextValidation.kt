package ai.ssot.contextapi.shared.validation

import ai.ssot.contextapi.shared.exception.CombinedCustomException
import ai.ssot.contextapi.shared.exception.CustomException
import ai.ssot.contextapi.shared.exception.RequiredFieldException

fun requireNonBlankText(
    fieldName: String,
    value: String,
) {
    if (value.isBlank()) {
        throw RequiredFieldException(fieldName)
    }
}

class ValidationErrorCollector {
    private val errors = mutableListOf<CustomException>()

    fun requireNonBlankText(
        fieldName: String,
        value: String,
    ) {
        if (value.isBlank()) {
            errors += RequiredFieldException(fieldName)
        }
    }

    fun add(error: CustomException) {
        errors += error
    }

    fun addIf(
        condition: Boolean,
        errorFactory: () -> CustomException,
    ) {
        if (condition) {
            errors += errorFactory()
        }
    }

    fun throwIfAny() {
        if (errors.isNotEmpty()) {
            throw CombinedCustomException(errors)
        }
    }
}
