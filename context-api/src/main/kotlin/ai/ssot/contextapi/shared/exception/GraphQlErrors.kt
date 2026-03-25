package ai.ssot.contextapi.shared.exception

import com.netflix.graphql.types.errors.ErrorType
import com.netflix.graphql.types.errors.TypedGraphQLError
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
            descriptor = ErrorDescriptor(
                code = ErrorCode.UNAUTHENTICATED,
                category = ErrorCategory.AUTHENTICATION,
                message = "Authentication is required.",
            ),
            path = path,
            location = location,
        )

    fun forbiddenError(environment: DataFetchingEnvironment): GraphQLError =
        buildError(
            descriptor = ErrorDescriptor(
                code = ErrorCode.FORBIDDEN,
                category = ErrorCategory.AUTHORIZATION,
                message = "You do not have permission to perform this action.",
            ),
            path = environment.executionStepInfo.path,
            location = environment.field.sourceLocation,
        )

    fun validationError(
        message: String,
        environment: DataFetchingEnvironment,
    ): GraphQLError =
        validationError(
            descriptors = listOf(
                ErrorDescriptor(
                    code = ErrorCode.VALIDATION_ERROR,
                    category = ErrorCategory.VALIDATION,
                    message = message,
                ),
            ),
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
    ): List<GraphQLError> {
        val validationDescriptors = exception.errors.filter { it.category == ErrorCategory.VALIDATION }
        val nonValidationDescriptors = exception.errors.filterNot { it.category == ErrorCategory.VALIDATION }
        val errors = mutableListOf<GraphQLError>()

        if (validationDescriptors.isNotEmpty()) {
            errors.plusAssign(validationError(validationDescriptors, path, location))
        }

        errors += nonValidationDescriptors.map { descriptor ->
            buildError(descriptor, path, location)
        }

        return errors
    }

    private fun validationError(
        descriptors: List<ErrorDescriptor>,
        path: ResultPath?,
        location: SourceLocation?,
    ): GraphQLError =
        buildError(
            descriptor = descriptors.first(),
            path = path,
            location = location,
            extraExtensions = mapOf(
                "violations" to descriptors.map { descriptor ->
                    buildMap<String, Any?> {
                        put("code", descriptor.code.name)
                        put("message", descriptor.message)
                        descriptor.field?.let { put("field", it) }
                        if (descriptor.details.isNotEmpty()) {
                            put("details", descriptor.details)
                        }
                    }
                },
            ),
        )

    private fun buildError(
        descriptor: ErrorDescriptor,
        path: ResultPath?,
        location: SourceLocation?,
        extraExtensions: Map<String, Any?> = emptyMap(),
    ): GraphQLError {
        val extensions = linkedMapOf<String, Any?>("code" to descriptor.code.name)
        extensions.putAll(extraExtensions)

        val builder = descriptor.category.newBuilder()
            .message(descriptor.message)
            .path(path)
            .location(location)
        if (extensions.isNotEmpty()) {
            builder.extensions(extensions)
        }

        return builder.build()
    }

    private fun ErrorCategory.newBuilder(): TypedGraphQLError.Builder =
        when (this) {
            ErrorCategory.VALIDATION -> TypedGraphQLError.newBadRequestBuilder().errorType(ErrorType.BAD_REQUEST)
            ErrorCategory.AUTHENTICATION, ErrorCategory.AUTHORIZATION ->
                TypedGraphQLError.newPermissionDeniedBuilder().errorType(ErrorType.PERMISSION_DENIED)
            ErrorCategory.NOT_FOUND -> TypedGraphQLError.newNotFoundBuilder().errorType(ErrorType.NOT_FOUND)
            ErrorCategory.CONFLICT -> TypedGraphQLError.newConflictBuilder().errorType(ErrorType.BAD_REQUEST)
            ErrorCategory.INTERNAL -> TypedGraphQLError.newInternalErrorBuilder().errorType(ErrorType.INTERNAL)
        }
}