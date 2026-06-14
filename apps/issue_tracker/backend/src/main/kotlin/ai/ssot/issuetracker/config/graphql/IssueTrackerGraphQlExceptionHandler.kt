package ai.ssot.issuetracker.config.graphql

import ai.ssot.issuetracker.domain.issue.exception.InvalidIssueRequestException
import ai.ssot.issuetracker.domain.project.exception.InvalidProjectRequestException
import graphql.GraphQLError
import graphql.GraphqlErrorBuilder
import graphql.schema.DataFetchingEnvironment
import org.springframework.graphql.data.method.annotation.GraphQlExceptionHandler
import org.springframework.web.bind.annotation.ControllerAdvice

@ControllerAdvice
class IssueTrackerGraphQlExceptionHandler {
    @GraphQlExceptionHandler
    fun handleInvalidProjectRequest(
        exception: InvalidProjectRequestException,
        environment: DataFetchingEnvironment,
    ): GraphQLError =
        GraphqlErrorBuilder.newError(environment)
            .message(exception.message ?: "Invalid project request.")
            .build()

    @GraphQlExceptionHandler
    fun handleInvalidIssueRequest(
        exception: InvalidIssueRequestException,
        environment: DataFetchingEnvironment,
    ): GraphQLError =
        GraphqlErrorBuilder.newError(environment)
            .message(exception.message ?: "Invalid issue request.")
            .build()
}
