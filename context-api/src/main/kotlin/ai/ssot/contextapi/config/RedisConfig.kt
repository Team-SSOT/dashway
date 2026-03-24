package ai.ssot.contextapi.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.redis.connection.RedisConnectionFactory
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory
import org.springframework.data.redis.core.RedisTemplate
import org.springframework.data.redis.serializer.StringRedisSerializer

@Configuration
class RedisConfig {


    @Value(value = "\${redis.host}")
    var REDIS_HOST = "localhost"

    @Value(value = "\${redis.port}")
    var REDIS_PORT = 144000

    @Bean
    fun redisConnectionFactory(): RedisConnectionFactory = LettuceConnectionFactory(REDIS_HOST, REDIS_PORT)

    @Bean
    fun redisTemplate(): RedisTemplate<String, Any> {
        return RedisTemplate<String, Any>()
            .apply {
                this.connectionFactory = redisConnectionFactory()
                keySerializer = StringRedisSerializer()
                valueSerializer = StringRedisSerializer()
                defaultSerializer = StringRedisSerializer()
            }
    }
}