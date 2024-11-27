package poc.amitk.lambda.sb.api.infra;

import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.AWSXRayRecorderBuilder;
import jakarta.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "xray.tracing.enabled", havingValue = "true")
public class AwsXRayConfig {
    // Create a logger instance
    private static final Logger logger = LoggerFactory.getLogger(StreamLambdaHandler.class);

    @PostConstruct
    public void init() {
        logger.info("Setting up XRay Tracing");

        // Initialize the AWS X-Ray recorder with default settings
        AWSXRay.setGlobalRecorder(AWSXRayRecorderBuilder.standard().build());

        logger.info("Setting up XRay Tracing Done");
    }
}