package ai.ssot.dashway.neo4jwriter.ingest.messaging;

import ai.ssot.dashway.neo4jwriter.ingest.application.GraphIngestOrchestrator;
import ai.ssot.dashway.neo4jwriter.ingest.application.GraphIngestOutcome;
import ai.ssot.dashway.neo4jwriter.ingest.config.RabbitTopologyProperties;
import ai.ssot.dashway.neo4jwriter.ingest.contract.DashwayGraphEvent;
import ai.ssot.dashway.neo4jwriter.ingest.messaging.publish.GraphEventFailurePublisher;
import ai.ssot.dashway.neo4jwriter.ingest.support.GraphMessageHeaders;
import ai.ssot.dashway.neo4jwriter.ingest.support.PermanentProcessingException;
import ai.ssot.dashway.neo4jwriter.ingest.support.TransientProcessingException;
import com.rabbitmq.client.Channel;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class GraphIngestListener {

    private static final Logger logger = LoggerFactory.getLogger(GraphIngestListener.class);

    private final ObjectMapper objectMapper;
    private final GraphIngestOrchestrator orchestrator;
    private final GraphEventFailurePublisher failurePublisher;
    private final RabbitTopologyProperties topologyProperties;

    public GraphIngestListener(
        ObjectMapper objectMapper,
        GraphIngestOrchestrator orchestrator,
        GraphEventFailurePublisher failurePublisher,
        RabbitTopologyProperties topologyProperties
    ) {
        this.objectMapper = objectMapper;
        this.orchestrator = orchestrator;
        this.failurePublisher = failurePublisher;
        this.topologyProperties = topologyProperties;
    }

    @RabbitListener(
        queues = "${dashway.ingest.rabbit.queue}",
        containerFactory = "manualAckRabbitListenerContainerFactory"
    )
    public void onMessage(Message message, Channel channel) throws IOException {
        long deliveryTag = message.getMessageProperties().getDeliveryTag();
        int attempt = GraphMessageHeaders.readAttempt(message.getMessageProperties().getHeaders());

        DashwayGraphEvent event;
        try {
            event = objectMapper.readValue(message.getBody(), DashwayGraphEvent.class);
        } catch (Exception exception) {
            logger.error("Failed to deserialize graph ingest message. Sending to DLQ.", exception);
            handleRawDeadLetter(message, channel, deliveryTag, "Invalid message body: " + exception.getMessage());
            return;
        }

        try {
            GraphIngestOutcome outcome = orchestrator.process(event);
            logger.info(
                "Processed graph eventId={}, eventType={}, status={}, endpoint={}",
                outcome.eventId(),
                outcome.eventType(),
                outcome.status(),
                outcome.endpointPath()
            );
            channel.basicAck(deliveryTag, false);
        } catch (PermanentProcessingException exception) {
            logger.error("Permanent failure for eventId={}. Sending to DLQ.", event.eventId(), exception);
            handleDeadLetter(event, attempt, exception.getMessage(), channel, deliveryTag);
        } catch (TransientProcessingException exception) {
            logger.warn("Transient failure for eventId={}, attempt={}", event.eventId(), attempt, exception);
            handleRetryOrDeadLetter(event, attempt, exception.getMessage(), channel, deliveryTag);
        }
    }

    private void handleRetryOrDeadLetter(
        DashwayGraphEvent event,
        int attempt,
        String failureReason,
        Channel channel,
        long deliveryTag
    ) throws IOException {
        try {
            if (attempt >= topologyProperties.getMaxAttempts()) {
                failurePublisher.publishDeadLetter(event, attempt, failureReason);
            } else {
                failurePublisher.publishRetry(event, attempt + 1, failureReason);
            }
            channel.basicAck(deliveryTag, false);
        } catch (RuntimeException publishException) {
            logger.error("Failed to publish retry/DLQ for eventId={}. Requeueing original message.", event.eventId(), publishException);
            channel.basicNack(deliveryTag, false, true);
        }
    }

    private void handleDeadLetter(
        DashwayGraphEvent event,
        int attempt,
        String failureReason,
        Channel channel,
        long deliveryTag
    ) throws IOException {
        try {
            failurePublisher.publishDeadLetter(event, attempt, failureReason);
            channel.basicAck(deliveryTag, false);
        } catch (RuntimeException publishException) {
            logger.error("Failed to publish DLQ for eventId={}. Requeueing original message.", event.eventId(), publishException);
            channel.basicNack(deliveryTag, false, true);
        }
    }

    private void handleRawDeadLetter(
        Message message,
        Channel channel,
        long deliveryTag,
        String failureReason
    ) throws IOException {
        try {
            failurePublisher.publishRawDeadLetter(message, failureReason);
            channel.basicAck(deliveryTag, false);
        } catch (RuntimeException publishException) {
            logger.error("Failed to publish raw invalid message to DLQ. Requeueing original message.", publishException);
            channel.basicNack(deliveryTag, false, true);
        }
    }
}
