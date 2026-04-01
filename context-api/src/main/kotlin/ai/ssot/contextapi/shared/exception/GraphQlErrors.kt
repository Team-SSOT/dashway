package ai.ssot.contextapi.shared.exception

import graphql.ErrorClassification
import graphql.GraphQLError
import graphql.execution.ResultPath
import graphql.language.SourceLocation
import graphql.schema.DataFetchingEnvironment

object GraphQlErrors {
    fun unauthenticatedError(environment: DataFetchingEnvironment): GraphQLError =
        unauthenticatedError(
            path = environment.executionStepInfo.path,
            location = environment.field.sourceLocation,
        )

    fun unauthenticatedError(
        path: ResultPath? = null,
        location: SourceLocation? = null,
    ): GraphQLError =
        buildError(
            message = "Authentication is required.",
            path = path,
            location = location,
        )

    fun forbiddenError(environment: DataFetchingEnvironment): GraphQLError =
        buildError(
            message = "You do not have permission to perform this action.",
            path = environment.executionStepInfo.path,
            location = environment.field.sourceLocation,
        )

    fun validationError(
        message: String,
        environment: DataFetchingEnvironment,
    ): GraphQLError =
        errorFromDescriptors(
            descriptors = listOf(ErrorDescriptor(message = message)),
            path = environment.executionStepInfo.path,
            location = environment.field.sourceLocation,
        )

    fun customErrors(
        exception: CustomException,
        environment: DataFetchingEnvironment,
    ): List<GraphQLError> =
        customErrors(
            exception = exception,
            path = environment.executionStepInfo.path,
            location = environment.field.sourceLocation,
        )

    private fun customErrors(
        exception: CustomException,
        path: ResultPath?,
        location: SourceLocation?,
    ): List<GraphQLError> =
        listOf(
            errorFromDescriptors(
                descriptors = exception.errors,
                path = path,
                location = location,
            ),
        )

    fun unexpectedError(
        message: String,
        environment: DataFetchingEnvironment,
    ): GraphQLError =
        buildError(
            message = message,
            path = environment.executionStepInfo.path,
            location = environment.field.sourceLocation,
        )

    private fun errorFromDescriptors(
        descriptors: List<ErrorDescriptor>,
        path: ResultPath?,
        location: SourceLocation?,
    ): GraphQLError {
        val firstDescriptor = descriptors.first()
        val shouldIncludeViolations = descriptors.size > 1 || descriptors.any { it.field != null || it.details.isNotEmpty() }

        return if (shouldIncludeViolations) {
            buildError(
                message = firstDescriptor.message,
                path = path,
                location = location,
                extraExtensions = mapOf(
                    "violations" to descriptors.map(::toViolation),
                ),
            )
        } else {
            buildError(
                message = firstDescriptor.message,
                path = path,
                location = location,
            )
        }
    }

    private fun buildError(
        message: String,
        path: ResultPath?,
        location: SourceLocation?,
        extraExtensions: Map<String, Any?> = emptyMap(),
    ): GraphQLError =
        SimpleGraphQLError(
            message = message,
            locations = location?.let(::listOf),
            path = path?.toList(),
            extensions = extraExtensions.ifEmpty { null },
        )

    private fun toViolation(descriptor: ErrorDescriptor): Map<String, Any?> =
        buildMap {
            put("message", descriptor.message)
            descriptor.field?.let { put("field", it) }
            if (descriptor.details.isNotEmpty()) {
                put("details", descriptor.details)
            }
        }

    private data class SimpleGraphQLError(
        private val message: String,
        private val locations: List<SourceLocation>?,
        private val path: List<Any>?,
        private val extensions: Map<String, Any?>?,
    ) : GraphQLError {
        override fun getMessage(): String = message

        override fun getLocations(): List<SourceLocation>? = locations

        override fun getPath(): List<Any>? = path

        override fun getExtensions(): Map<String, Any?>? = extensions

        override fun getErrorType(): ErrorClassification? = null
    }
}
