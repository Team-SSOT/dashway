package ai.ssot.contextapi.security

import ai.ssot.contextapi.security.filter.AuthenticationFilter
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
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
                    .requestMatchers(HttpMethod.POST, "/api/auth/token/validate").authenticated()
                    .requestMatchers(HttpMethod.GET, "/members/**").authenticated()
                    .requestMatchers(HttpMethod.GET, "/files", "/files/**").authenticated()
                    .requestMatchers(HttpMethod.POST, "/files", "/files/**").authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/files/**").authenticated()
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
            allowedMethods = listOf("GET", "POST", "OPTIONS")
            allowedHeaders = listOf("Authorization", "Content-Type")
        }
        val fileConfiguration = CorsConfiguration().apply {
            allowCredentials = false
            allowedOrigins = authProperties.corsAllowedOrigins
            allowedMethods = listOf("GET", "POST", "DELETE", "OPTIONS")
            allowedHeaders = listOf("Authorization", "Content-Type")
            exposedHeaders = listOf("Content-Length", "Content-Type", "Content-Disposition", "ETag")
        }

        return UrlBasedCorsConfigurationSource().apply {
            registerCorsConfiguration("/graphql", configuration)
            registerCorsConfiguration("/members/**", configuration)
            registerCorsConfiguration("/files", fileConfiguration)
            registerCorsConfiguration("/files/**", fileConfiguration)
        }
    }
}
