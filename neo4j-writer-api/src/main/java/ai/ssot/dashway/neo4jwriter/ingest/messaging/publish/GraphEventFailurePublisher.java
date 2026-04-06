package ai.ssot.dashway.neo4jwriter.ingest.messaging.publish;

import ai.ssot.dashway.neo4jwriter.ingest.config.RabbitTopologyProperties;
import ai.ssot.dashway.neo4jwriter.ingest.contract.DashwayGraphEvent;
import ai.ssot.dashway.neo4jwriter.ingest.support.GraphMessageHeaders;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageBuilder;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
public class GraphEventFailurePublisher {

    private final RabbitTemplate rabbitTemplate;
    private final RabbitTopologyProperties properties;

    public GraphEventFailurePublisher(RabbitTemplate rabbitTemplate, RabbitTopologyProperties properties) {
        this.rabbitTemplate = rabbitTemplate;
        this.properties = properties;
    }

    public void publishRetry(DashwayGraphEvent event, int nextAttempt, String failureReason) {
        rabbitTemplate.convertAndSend(
            properties.getRetryExchange(),
            properties.getRetryRoutingKey(),
            event,
            message -> {
                message.getMessageProperties().setHeader(GraphMessageHeaders.ATTEMPT, nextAttempt);
                message.getMessageProperties().setHeader(GraphMessageHeaders.FAILURE_REASON, failureReason);
                message.getMessageProperties().setHeader(GraphMessageHeaders.ORIGINAL_EVENT_ID, event.eventId());
                message.getMessageProperties().setHeader(GraphMessageHeaders.ORIGINAL_EVENT_TYPE, event.eventType());
                return message;
            }
        );
    }

    public void publishDeadLetter(DashwayGraphEvent event, int attempt, String failureReason) {
        rabbitTemplate.convertAndSend(
            properties.getDlqExchange(),
            properties.getDlqRoutingKey(),
            event,
            message -> {
                message.getMessageProperties().setHeader(GraphMessageHeaders.ATTEMPT, attempt);
                message.getMessageProperties().setHeader(GraphMessageHeaders.FAILURE_REASON, failureReason);
                message.getMessageProperties().setHeader(GraphMessageHeaders.ORIGINAL_EVENT_ID, event.eventId());
                message.getMessageProperties().setHeader(GraphMessageHeaders.ORIGINAL_EVENT_TYPE, event.eventType());
                return message;
            }
        );
    }

    public void publishRawDeadLetter(Message message, String failureReason) {
        Message deadLetter = MessageBuilder.withBody(message.getBody())
            .copyHeaders(message.getMessageProperties().getHeaders())
            .setContentType(message.getMessageProperties().getContentType())
            .setHeader(GraphMessageHeaders.FAILURE_REASON, failureReason)
            .build();

        rabbitTemplate.send(properties.getDlqExchange(), properties.getDlqRoutingKey(), deadLetter);
    }
}
