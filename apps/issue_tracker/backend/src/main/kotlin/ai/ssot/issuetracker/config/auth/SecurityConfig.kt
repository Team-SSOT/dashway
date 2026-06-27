package ai.ssot.issuetracker.config.auth

import org.springframework.beans.factory.annotation.Value
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
    private val issueTrackerGraphQlAuthenticationFilter: IssueTrackerGraphQlAuthenticationFilter,
    private val issueTrackerAuthenticationEntryPoint: IssueTrackerAuthenticationEntryPoint,
    @Value("\${spring.graphql.http.path:/graphql}")
    private val graphQlPath: String,
) {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain =
        http.csrf { it.disable() }
            .headers { headers -> headers.frameOptions { it.disable() } }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers(HttpMethod.POST, graphQlPath).authenticated()
                    .anyRequest().permitAll()
            }
            .addFilterBefore(issueTrackerGraphQlAuthenticationFilter, AuthorizationFilter::class.java)
            .exceptionHandling {
                it.authenticationEntryPoint(issueTrackerAuthenticationEntryPoint)
            }
            .build()
}
