package ai.ssot.contextapi

import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
@ConfigurationPropertiesScan
class ContextApiApplication

fun main(args: Array<String>) {
    runApplication<ContextApiApplication>(*args)
}
