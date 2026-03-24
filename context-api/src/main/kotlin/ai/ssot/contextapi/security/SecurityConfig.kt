package ai.ssot.contextapi.security

import ai.ssot.contextapi.security.token.AccessTokenService
import com.nimbusds.jose.jwk.source.ImmutableSecret
import com.nimbusds.jose.proc.SecurityContext
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.convert.converter.Converter
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.security.oauth2.jose.jws.MacAlgorithm
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.JwtEncoder
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder
import org.springframework.security.web.SecurityFilterChain
import javax.crypto.spec.SecretKeySpec

@Configuration
@EnableWebSecurity
class SecurityConfig {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        return http.csrf { it.disable() }
            .sessionManagement { it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) }
            .authorizeHttpRequests {
                it.requestMatchers("/graphql").permitAll()
                    .anyRequest().denyAll()
            }
            .build()
    }

    @Bean
    fun jwtDecoder(authProperties: AuthProperties): JwtDecoder =
        NimbusJwtDecoder
            .withSecretKey(secretKey(authProperties))
            .macAlgorithm(MacAlgorithm.HS256)
            .build()

    @Bean
    fun jwtEncoder(authProperties: AuthProperties): JwtEncoder =
        NimbusJwtEncoder(ImmutableSecret<SecurityContext>(secretKey(authProperties)))

    @Bean
    fun jwtAuthenticationConverter(
        accessTokenService: AccessTokenService,
    ): Converter<Jwt, UsernamePasswordAuthenticationToken> =
        Converter(accessTokenService::toAuthentication)

    @Bean
    fun passwordEncoder(): PasswordEncoder = BCryptPasswordEncoder()

    private fun secretKey(authProperties: AuthProperties) =
        SecretKeySpec(authProperties.jwtSecret.toByteArray(), "HmacSHA256")
}
