package ai.ssot.chat.config.graphql

import ai.ssot.chat.domain.chat.exception.InvalidChatRoomRequestException
import graphql.GraphQLError
import graphql.GraphqlErrorBuilder
import graphql.schema.DataFetchingEnvironment
import org.springframework.graphql.data.method.annotation.GraphQlExceptionHandler
import org.springframework.web.bind.annotation.ControllerAdvice

@ControllerAdvice
class ChatGraphQlExceptionHandler {
    @GraphQlExceptionHandler
    fun handleInvalidChatRoomRequest(
        exception: InvalidChatRoomRequestException,
        environment: DataFetchingEnvironment,
    ): GraphQLError =
        GraphqlErrorBuilder.newError(environment)
            .message(exception.message ?: "Invalid request.")
            .build()
}
