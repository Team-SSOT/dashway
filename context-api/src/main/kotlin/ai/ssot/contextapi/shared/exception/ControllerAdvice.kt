package ai.ssot.contextapi.shared.exception

import graphql.GraphQLError
import graphql.schema.DataFetchingEnvironment
import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.graphql.data.method.annotation.GraphQlExceptionHandler
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.core.AuthenticationException
import org.springframework.web.bind.annotation.ControllerAdvice

@ControllerAdvice
class ContextGraphQlExceptionHandler {
    private val logger = KotlinLogging.logger { }

    @GraphQlExceptionHandler
    fun handleCustomException(
        exception: CustomException,
        environment: DataFetchingEnvironment,
    ): List<GraphQLError> =
        exception.also(::logHandled).let { handled ->
            GraphQlErrors.customErrors(handled, environment)
        }

    @GraphQlExceptionHandler
    fun handleAuthenticationException(
        exception: AuthenticationException,
        environment: DataFetchingEnvironment,
    ): GraphQLError =
        exception.also(::logHandled).let {
            GraphQlErrors.unauthenticatedError(environment)
        }

    @GraphQlExceptionHandler
    fun handleAccessDeniedException(
        exception: AccessDeniedException,
        environment: DataFetchingEnvironment,
    ): GraphQLError =
        exception.also(::logHandled).let {
            GraphQlErrors.forbiddenError(environment)
        }

    @GraphQlExceptionHandler
    fun handleIllegalArgumentException(
        exception: IllegalArgumentException,
        environment: DataFetchingEnvironment,
    ): GraphQLError =
        exception.also(::logHandled).let { handled ->
            GraphQlErrors.validationError(
                message = handled.message ?: "Invalid request.",
                environment = environment,
            )
        }

    private fun logHandled(exception: Throwable) {
        logger.warn(exception) { "GraphQL request failed." }
    }
}
