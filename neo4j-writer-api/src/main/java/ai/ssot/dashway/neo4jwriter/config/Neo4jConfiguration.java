package ai.ssot.dashway.neo4jwriter.config;

import java.util.concurrent.TimeUnit;
import org.neo4j.driver.AuthTokens;
import org.neo4j.driver.Config;
import org.neo4j.driver.Driver;
import org.neo4j.driver.GraphDatabase;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class Neo4jConfiguration {

    @Bean(destroyMethod = "close")
    Driver neo4jDriver(Neo4jConnectionProperties properties) {
        Driver driver = GraphDatabase.driver(
            properties.getUri(),
            AuthTokens.basic(properties.getUsername(), properties.getPassword()),
            Config.builder()
                .withConnectionTimeout(5, TimeUnit.SECONDS)
                .withMaxConnectionPoolSize(20)
                .build()
        );

        driver.verifyConnectivity();
        return driver;
    }
}
