package ai.ssot.contextapi.domain.storage.exception

import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.ResponseStatus

@ResponseStatus(HttpStatus.BAD_REQUEST)
class InvalidStorageRequestException(message: String) : RuntimeException(message)

@ResponseStatus(HttpStatus.UNAUTHORIZED)
class StorageUnauthenticatedException : RuntimeException("Authentication is required.")

@ResponseStatus(HttpStatus.FORBIDDEN)
class StorageForbiddenException : RuntimeException("You do not have permission to perform this action.")

@ResponseStatus(HttpStatus.NOT_FOUND)
class StorageFileNotFoundException : RuntimeException("File not found.")

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
class FileStorageException : RuntimeException("File could not be stored.")
