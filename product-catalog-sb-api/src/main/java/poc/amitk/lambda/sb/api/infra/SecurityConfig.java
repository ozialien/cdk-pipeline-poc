package poc.amitk.lambda.sb.api.infra;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@EnableWebSecurity(debug = true)
public class SecurityConfig {
    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

    @Value("${app.security.oauth2.enabled:false}")
    public boolean oauth2Enabled;

    @Value("${app.security.csrf.enabled:false}")
    private boolean enableCsrf;

    @Value("${security.oauth2.resource.jwk.key-set-uri:''}")
    private String jwkUri;

    @Bean
    @Order(1)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        String methodName = new Exception().getStackTrace()[0].getMethodName();
        logger.info("Entering {}.{}", this.getClass().getName(), methodName);
        try {
            if (oauth2Enabled) {
                logger.info("Enforcing OAUTH2");
                http.authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/products").hasAuthority("SCOPE_catalog/read")
                        .requestMatchers(HttpMethod.DELETE, "/products").hasAuthority("SCOPE_catalog/update")
                        .requestMatchers(HttpMethod.GET, "/products/*").hasAuthority("SCOPE_catalog/read")
                        .requestMatchers(HttpMethod.POST, "/products").hasAuthority("SCOPE_catalog/update")
                        .requestMatchers(HttpMethod.DELETE, "/products/*").hasAuthority("SCOPE_catalog/update")
                        .anyRequest().authenticated())
                        .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.decoder(jwtDecoder())));

            } else {
                logger.info("Switching off OAUTH2");

                http.authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll() // Allow all requests without authentication
                );
            }
        } catch (Exception e) {
            logger.error("Exception: ", e);
            throw e;
        }
        return http.build();

    }

    @Bean
    public NimbusJwtDecoder jwtDecoder() {
        String methodName = new Exception().getStackTrace()[0].getMethodName();
        logger.info("Entering {}.{}", this.getClass().getName(), methodName);
        NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder
                .withJwkSetUri(jwkUri)
                .build();

        // jwtDecoder.setClaimSetConverter(this::convertClaims);
        logger.info("Exiting {}.{}", this.getClass().getName(), methodName);
        return jwtDecoder;
    }

    private Map<String, Object> convertClaims(Map<String, Object> claims) {
        // Map specific claims if needed; e.g., convert Cognito roles to Spring Security
        // roles
        // Here you might need to map roles from a Cognito-specific claim
        String methodName = new Exception().getStackTrace()[0].getMethodName();
        logger.info("Entering {}.{}", this.getClass().getName(), methodName);
        logger.info("claims {}", claims);
        return claims;
    }
}
