package ai.ssot.contextapi

internal const val TEST_AUTOCONFIG_EXCLUDES =
    "spring.autoconfigure.exclude=" +
        "org.springframework.boot.neo4j.autoconfigure.Neo4jAutoConfiguration," +
        "org.springframework.boot.data.neo4j.autoconfigure.DataNeo4jAutoConfiguration," +
        "org.springframework.boot.data.neo4j.autoconfigure.DataNeo4jReactiveAutoConfiguration," +
        "org.springframework.boot.data.neo4j.autoconfigure.DataNeo4jReactiveRepositoriesAutoConfiguration," +
        "org.springframework.boot.data.neo4j.autoconfigure.DataNeo4jRepositoriesAutoConfiguration," +
        "org.springframework.boot.data.redis.autoconfigure.DataRedisRepositoriesAutoConfiguration"
