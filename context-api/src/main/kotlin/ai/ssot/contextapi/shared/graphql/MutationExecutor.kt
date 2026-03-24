package ai.ssot.contextapi.shared.graphql

import ai.ssot.contextapi.shared.exception.CustomException

inline fun <T> executeMutation(
    action: () -> T,
    onError: (List<MutationError>) -> T,
): T =
    try {
        action()
    } catch (exception: CustomException) {
        onError(exception.errors)
    }
