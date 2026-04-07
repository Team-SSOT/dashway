package ai.ssot.dashway.neo4jwriter.common.api;

import ai.ssot.dashway.neo4jwriter.common.contract.ErrorResponse;
import ai.ssot.dashway.neo4jwriter.common.exception.GraphEntityNotFoundException;
import ai.ssot.dashway.neo4jwriter.common.exception.InvalidGraphRequestException;
import ai.ssot.dashway.neo4jwriter.common.exception.Neo4jUnavailableException;
import org.neo4j.driver.exceptions.Neo4jException;
import org.neo4j.driver.exceptions.ServiceUnavailableException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(InvalidGraphRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleInvalidGraphRequest(InvalidGraphRequestException exception) {
        return new ErrorResponse(exception.getMessage());
    }

    @ExceptionHandler(GraphEntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleGraphEntityNotFound(GraphEntityNotFoundException exception) {
        return new ErrorResponse(exception.getMessage());
    }

    @ExceptionHandler(Neo4jUnavailableException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public ErrorResponse handleNeo4jUnavailable(Neo4jUnavailableException exception) {
        return new ErrorResponse(exception.getMessage());
    }

    @ExceptionHandler(ServiceUnavailableException.class)
    @ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
    public ErrorResponse handleServiceUnavailable(ServiceUnavailableException exception) {
        return new ErrorResponse("Neo4j is not reachable: " + exception.getMessage());
    }

    @ExceptionHandler(Neo4jException.class)
    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    public ErrorResponse handleNeo4jException(Neo4jException exception) {
        return new ErrorResponse("Neo4j request failed: " + exception.getMessage());
    }
}
