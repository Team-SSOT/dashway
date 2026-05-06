package ai.ssot.chat.config.auth

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpMethod
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.access.intercept.AuthorizationFilter

@Configuration
@EnableWebSecurity
class SecurityConfig(
    private val chatGraphQlAuthenticationFilter: ChatGraphQlAuthenticationFilter,
    private val chatAuthenticationEntryPoint: ChatAuthenticationEntryPoint,
) {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain =
        http.csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers(HttpMethod.POST, "/graphql").authenticated()
                    .anyRequest().permitAll()
            }
            .addFilterBefore(chatGraphQlAuthenticationFilter, AuthorizationFilter::class.java)
            .exceptionHandling {
                it.authenticationEntryPoint(chatAuthenticationEntryPoint)
            }
            .build()
}
