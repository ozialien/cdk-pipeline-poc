package poc.amitk.lambda.sb.api.infra;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@EnableWebSecurity(debug = true)
public class SecurityConfig {
    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

    /** 
     * 
     * Only really needed if your mapping scopes.
     *  
     **/    
    public class CustomJwtAuthenticationConverter extends JwtAuthenticationConverter {

        public CustomJwtAuthenticationConverter() {
            JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
            grantedAuthoritiesConverter.setAuthorityPrefix("SCOPE_");
            grantedAuthoritiesConverter.setAuthoritiesClaimName("authorities"); // Use the custom claim "authorities"
            setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        }
    }

    @Value("${app.security.oauth2.enabled:false}")
    public boolean oauth2Enabled;

    @Value("${app.security.csrf.enabled:false}")
    private boolean enableCsrf;

    @Value("${security.oauth2.resource.jwk.key-set-uri:''}")
    private String jwkUri;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        String methodName = new Exception().getStackTrace()[0].getMethodName();
        logger.info("Entering {}.{}", this.getClass().getName(), methodName);
        try {
            if (oauth2Enabled) {
                logger.info("Enforcing OAUTH2");
                http.authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/products")
                        .hasAnyAuthority("SCOPE_catalog/read", "SCOPE_catalog/update")
                        .requestMatchers(HttpMethod.DELETE, "/products").hasAuthority("SCOPE_catalog/update")
                        .requestMatchers(HttpMethod.GET, "/products/*")
                        .hasAnyAuthority("SCOPE_catalog/read", "SCOPE_catalog/update")
                        .requestMatchers(HttpMethod.POST, "/products").hasAuthority("SCOPE_catalog/update")
                        .requestMatchers(HttpMethod.DELETE, "/products/*").hasAuthority("SCOPE_catalog/update")
                        .anyRequest().authenticated())
                        .oauth2ResourceServer(
                                oauth2 -> oauth2.jwt(
                                        jwt -> {
                                            jwt.decoder(jwtDecoder());
                                            // jwt.jwkSetUri(this.jwkUri);
                                            jwt.jwtAuthenticationConverter(new CustomJwtAuthenticationConverter());
                                        }));
                                        

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

        jwtDecoder.setClaimSetConverter(this::convertClaims);
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

        if (claims.containsKey("scope")) {
            String scopes = (String) claims.get("scope");
            List<String> authorities = Arrays.stream(scopes.split(" ")).map(
                    scope -> {
                        if (scope.equals("aws.cognito.signin.user.admin")) {
                            return "SCOPE_catalog/update";
                        } else {
                            return scope;
                        }

                    }).collect(Collectors.toList());
            claims.put("authorities", authorities);
            logger.info("post processing claims {}", claims);
        }

        logger.info("Entering {}.{}", this.getClass().getName(), methodName);

        return claims;
    }
}
