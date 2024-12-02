package poc.amitk.lambda.sb.api.infra;

import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.AWSXRayRecorderBuilder;
import com.amazonaws.xray.strategy.sampling.LocalizedSamplingStrategy;

import jakarta.annotation.PostConstruct;

import java.net.URL;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableAutoConfiguration
@ConditionalOnProperty(name = "xray.tracing.enabled", havingValue = "true")
public class AwsXRayConfig {
    // Create a logger instance
    private static final Logger logger = LoggerFactory.getLogger(StreamLambdaHandler.class);

    @PostConstruct
    public void init() {
        logger.info("Setting up XRay Tracing");
        AWSXRayRecorderBuilder builder = AWSXRayRecorderBuilder.standard();
        URL ruleFile = AwsXRayConfig.class.getResource("/sampling-rules.json");
        builder.withSamplingStrategy(new LocalizedSamplingStrategy(ruleFile));
        AWSXRay.setGlobalRecorder(builder.build());
        AWSXRay.beginSegment("setup-xray");
        logger.info("Setting up XRay Tracing Done");
        AWSXRay.endSegment();   
    }
}