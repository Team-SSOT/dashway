package ai.ssot.contextapi.security

import ai.ssot.contextapi.security.filter.AuthenticationFilter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.access.intercept.AuthorizationFilter
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val authProperties: AuthProperties,
    private val authenticationFilter: AuthenticationFilter,
    private val authenticationEntryPoint: AuthenticationEntryPoint,
) {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        return http.csrf { it.disable() }
            .cors { }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers(
                    "/graphql",
                    "/internal/install/health",
                    "/internal/install/bootstrap",
                ).permitAll()
                    .anyRequest().denyAll()
            }
            .addFilterBefore(authenticationFilter, AuthorizationFilter::class.java)
            .exceptionHandling {
                it.authenticationEntryPoint(authenticationEntryPoint)
            }
            .build()
    }

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration().apply {
            allowCredentials = false
            allowedOrigins = authProperties.corsAllowedOrigins
            allowedMethods = listOf("POST", "OPTIONS")
            allowedHeaders = listOf("Authorization", "Content-Type")
        }

        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/graphql", configuration)
        }
    }
}
