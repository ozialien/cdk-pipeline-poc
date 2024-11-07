import org.springframework.context.ApplicationListener;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class AuthenticationSuccessListener implements ApplicationListener<AuthenticationSuccessEvent> {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationSuccessListener.class);

    @Override
    public void onApplicationEvent(AuthenticationSuccessEvent event) {
        Authentication authentication = event.getAuthentication();
        logger.info("User '{}' successfully authenticated with roles: {}",
                    authentication.getName(),
                    authentication.getAuthorities());
    }
}