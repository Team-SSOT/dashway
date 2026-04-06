package ai.ssot.dashway.neo4jwriter.ingest.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "dashway.ingest.rabbit")
public class RabbitTopologyProperties {

    @NotBlank
    private String exchange = "dashway.graph";

    @NotBlank
    private String routingKey = "ingest";

    @NotBlank
    private String queue = "dashway.graph.ingest";

    @NotBlank
    private String retryExchange = "dashway.graph.retry";

    @NotBlank
    private String retryRoutingKey = "ingest.retry";

    @NotBlank
    private String retryQueue = "dashway.graph.ingest.retry";

    @NotBlank
    private String dlqExchange = "dashway.graph.dlx";

    @NotBlank
    private String dlqRoutingKey = "ingest.dlq";

    @NotBlank
    private String dlqQueue = "dashway.graph.ingest.dlq";

    @Min(1000)
    private long retryDelayMs = 30_000;

    @Min(1)
    private int maxAttempts = 5;

    @Min(1)
    private int prefetch = 20;

    public String getExchange() {
        return exchange;
    }

    public void setExchange(String exchange) {
        this.exchange = exchange;
    }

    public String getRoutingKey() {
        return routingKey;
    }

    public void setRoutingKey(String routingKey) {
        this.routingKey = routingKey;
    }

    public String getQueue() {
        return queue;
    }

    public void setQueue(String queue) {
        this.queue = queue;
    }

    public String getRetryExchange() {
        return retryExchange;
    }

    public void setRetryExchange(String retryExchange) {
        this.retryExchange = retryExchange;
    }

    public String getRetryRoutingKey() {
        return retryRoutingKey;
    }

    public void setRetryRoutingKey(String retryRoutingKey) {
        this.retryRoutingKey = retryRoutingKey;
    }

    public String getRetryQueue() {
        return retryQueue;
    }

    public void setRetryQueue(String retryQueue) {
        this.retryQueue = retryQueue;
    }

    public String getDlqExchange() {
        return dlqExchange;
    }

    public void setDlqExchange(String dlqExchange) {
        this.dlqExchange = dlqExchange;
    }

    public String getDlqRoutingKey() {
        return dlqRoutingKey;
    }

    public void setDlqRoutingKey(String dlqRoutingKey) {
        this.dlqRoutingKey = dlqRoutingKey;
    }

    public String getDlqQueue() {
        return dlqQueue;
    }

    public void setDlqQueue(String dlqQueue) {
        this.dlqQueue = dlqQueue;
    }

    public long getRetryDelayMs() {
        return retryDelayMs;
    }

    public void setRetryDelayMs(long retryDelayMs) {
        this.retryDelayMs = retryDelayMs;
    }

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public int getPrefetch() {
        return prefetch;
    }

    public void setPrefetch(int prefetch) {
        this.prefetch = prefetch;
    }
}
