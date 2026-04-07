package ai.ssot.dashway.neo4jwriter.ingest.config;

import java.util.Map;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.json.JsonMapper;

@Configuration
public class IngestConfiguration {

    @Bean
    DirectExchange graphExchange(RabbitTopologyProperties properties) {
        return new DirectExchange(properties.getExchange(), true, false);
    }

    @Bean
    DirectExchange graphRetryExchange(RabbitTopologyProperties properties) {
        return new DirectExchange(properties.getRetryExchange(), true, false);
    }

    @Bean
    DirectExchange graphDlqExchange(RabbitTopologyProperties properties) {
        return new DirectExchange(properties.getDlqExchange(), true, false);
    }

    @Bean
    Queue graphIngestQueue(RabbitTopologyProperties properties) {
        return QueueBuilder.durable(properties.getQueue())
            .withArguments(
                Map.of(
                    "x-dead-letter-exchange", properties.getDlqExchange(),
                    "x-dead-letter-routing-key", properties.getDlqRoutingKey()
                )
            )
            .build();
    }

    @Bean
    Queue graphRetryQueue(RabbitTopologyProperties properties) {
        return QueueBuilder.durable(properties.getRetryQueue())
            .withArguments(
                Map.of(
                    "x-message-ttl", properties.getRetryDelayMs(),
                    "x-dead-letter-exchange", properties.getExchange(),
                    "x-dead-letter-routing-key", properties.getRoutingKey()
                )
            )
            .build();
    }

    @Bean
    Queue graphDlqQueue(RabbitTopologyProperties properties) {
        return QueueBuilder.durable(properties.getDlqQueue()).build();
    }

    @Bean
    Binding graphIngestBinding(
        @Qualifier("graphIngestQueue") Queue queue,
        @Qualifier("graphExchange") DirectExchange exchange,
        RabbitTopologyProperties properties
    ) {
        return BindingBuilder.bind(queue).to(exchange).with(properties.getRoutingKey());
    }

    @Bean
    Binding graphRetryBinding(
        @Qualifier("graphRetryQueue") Queue queue,
        @Qualifier("graphRetryExchange") DirectExchange exchange,
        RabbitTopologyProperties properties
    ) {
        return BindingBuilder.bind(queue).to(exchange).with(properties.getRetryRoutingKey());
    }

    @Bean
    Binding graphDlqBinding(
        @Qualifier("graphDlqQueue") Queue queue,
        @Qualifier("graphDlqExchange") DirectExchange exchange,
        RabbitTopologyProperties properties
    ) {
        return BindingBuilder.bind(queue).to(exchange).with(properties.getDlqRoutingKey());
    }

    @Bean
    JacksonJsonMessageConverter jacksonJsonMessageConverter(JsonMapper objectMapper) {
        return new JacksonJsonMessageConverter(objectMapper);
    }

    @Bean
    RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, JacksonJsonMessageConverter converter) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(converter);
        rabbitTemplate.setBeforePublishPostProcessors(message -> {
            message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
            return message;
        });
        return rabbitTemplate;
    }

    @Bean
    SimpleRabbitListenerContainerFactory manualAckRabbitListenerContainerFactory(
        ConnectionFactory connectionFactory,
        JacksonJsonMessageConverter converter,
        RabbitTopologyProperties properties
    ) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(converter);
        factory.setDefaultRequeueRejected(false);
        factory.setPrefetchCount(properties.getPrefetch());
        factory.setAcknowledgeMode(org.springframework.amqp.core.AcknowledgeMode.MANUAL);
        return factory;
    }
}
