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
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This demo's how to map from a 3rd party auth to your local service scopes. In
 * general if you authority supports your scopes
 * you only need to configure:
 * 
 * jwt.jwkSetUri(this.jwkUri);
 * 
 * This is very different for different versions of spring. e.g. the latest
 * implementations do it differently again.
 * 
 */
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

        private CustomJwtAuthenticationConverter() {
            JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
            grantedAuthoritiesConverter.setAuthorityPrefix("SCOPE_");
            grantedAuthoritiesConverter.setAuthoritiesClaimName("authorities"); // Use the custom claim "authorities"
            setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
        }

    }

    /**
     * We redefine the standard Scope in mapping so we have to validate it from its
     * different location
     * Merely decrypting the token and finding authorities is the authentication.
     */
    public class CustomJwtValidator implements OAuth2TokenValidator<Jwt> {

        @Override
        public OAuth2TokenValidatorResult validate(Jwt jwt) {
            String methodName = new Exception().getStackTrace()[0].getMethodName();
            logger.info("Entering {}.{}", this.getClass().getName(), methodName);
            logger.info("claims {}", jwt.getClaims());
            // Example: Custom validation for specific claim presence
            if (!jwt.hasClaim("authorities")) {
                List<OAuth2Error> errors = new ArrayList<OAuth2Error>();
                errors.add(new OAuth2Error("The required 'authorities' claim is missing."));
                logger.info("Exiting with Errors {}.{}.{}", this.getClass().getName(), methodName, errors);
                return OAuth2TokenValidatorResult.failure(errors);
            }
            logger.info("Exiting {}.{}", this.getClass().getName(), methodName);
            return OAuth2TokenValidatorResult.success();
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
                        .hasAnyAuthority("SCOPE_aws.cognito.signin.user.admin", "SCOPE_catalog/update")
                        .requestMatchers(HttpMethod.DELETE, "/products").hasAuthority("SCOPE_catalog/update")
                        .requestMatchers(HttpMethod.GET, "/products/*")
                        .hasAnyAuthority("SCOPE_catalog/read", "SCOPE_catalog/update")
                        .requestMatchers(HttpMethod.POST, "/products").hasAuthority("SCOPE_catalog/update")
                        .requestMatchers(HttpMethod.DELETE, "/products/*").hasAuthority("SCOPE_catalog/update")
                        .anyRequest().authenticated())
                        .oauth2ResourceServer(
                                oauth2 -> oauth2.jwt(
                                        jwt -> {
                                            ////
                                            //
                                            // If your OAuth2 provider uses its own scopes or roles then
                                            // you will have to do a variation of this.
                                            // In the case you have multiple providers some map and some don't
                                            // you will also do this.
                                            //
                                            // NimbusJwtDecoder decoder = jwtDecoder();
                                            // decoder.setClaimSetConverter(this::convertClaims);
                                            // decoder.setJwtValidator(new CustomJwtValidator());                                            
                                            // jwt.jwtAuthenticationConverter(new CustomJwtAuthenticationConverter());
                                            // jwt.decoder(decoder);
                                            // ////
                                            //
                                            // If your OAuth2 provider uses your scopes then just do the following.
                                            //
                                            //
                                            jwt.jwkSetUri(this.jwkUri);
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
        logger.info("Exiting {}.{}", this.getClass().getName(), methodName);
        return jwtDecoder;
    }

    private Map<String, Object> convertClaims(Map<String, Object> claims) {
        // Map specific claims if needed; e.g., convert Cognito roles to Spring Security
        // roles
        // Here you might need to map roles from a Cognito-specific claim
        Map<String, Object> modifiableClaims = new HashMap<>(claims);
        String methodName = new Exception().getStackTrace()[0].getMethodName();
        logger.info("Entering {}.{}", this.getClass().getName(), methodName);
        logger.info("claims {}", claims);
        try {
            if (claims.containsKey("scope")) {
                String scope = (String) claims.get("scope");
                List<String> scopes = Arrays.asList(scope.split(" "));
                logger.info("scopes {}", scopes);
                if (scopes.size() > 0) {
                    List<String> authorities = scopes.stream().map(
                            s -> s.equals("aws.cognito.signin.user.admin") ? "SCOPE_catalog/update" : s)
                            .collect(Collectors.toList());

                    logger.info("authorities {}", authorities);
                    modifiableClaims.put("authorities", authorities);
                }
            }
        } catch (Exception e) {
            logger.error("Error", e);

        }
        logger.info("post processing claims {}", modifiableClaims);
        logger.info("Entering {}.{}", this.getClass().getName(), methodName);

        return modifiableClaims;
    }
}
