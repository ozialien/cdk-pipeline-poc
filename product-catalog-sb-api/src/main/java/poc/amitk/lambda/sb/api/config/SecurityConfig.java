import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.annotation.Order;
import org.springframework.security.access.method.P;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.oauth2.client.OAuth2LoginConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import static org.springframework.security.config.Customizer.withDefaults;
import org.springframework.security.config.Customizer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@SpringBootApplication(exclude = { SecurityAutoConfiguration.class })
@EnableWebSecurity(debug = true)
public class SecurityConfig {
        private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

        @Value("${app.security.oauth2.enabled:false}")
        public boolean oauth2Enabled;

        @Value("${app.security.csrf.enabled:false}")
        private boolean enableCsrf;

        @Bean
        @Lazy(false) // Force eager initialization
        @Order(1)
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                String methodName = new Exception().getStackTrace()[0].getMethodName();
                logger.info("Entering {}.{}", this.getClass().getName(), methodName);

                if (oauth2Enabled) {
                        logger.info("Enforcing OAUTH2");
                        http.authorizeHttpRequests(auth -> auth
                                        .requestMatchers("/public/**").permitAll()
                                        .anyRequest().authenticated())
                                        .oauth2Client(withDefaults())
                                        //.csrf(enableCsrf ? withDefaults() : null)
                                        ;

                } else {
                        logger.info("Switching off OAUTH2");

                        http.authorizeHttpRequests(auth -> auth
                                        .anyRequest().permitAll() // Allow all requests without authentication
                        )
                        //.csrf(enableCsrf ? withDefaults() : null)
                        ;
                }

                logger.info("Exiting {}.{}", this.getClass().getName(), methodName);
                return http.build();
        }

}
