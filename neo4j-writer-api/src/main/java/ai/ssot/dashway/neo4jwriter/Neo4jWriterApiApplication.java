package ai.ssot.dashway.neo4jwriter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class Neo4jWriterApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(Neo4jWriterApiApplication.class, args);
    }
}
