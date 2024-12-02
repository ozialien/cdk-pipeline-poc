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


    static {
     
      }




    @PostConstruct
    public void init() {
        logger.info("Setting up XRay Tracing");

        AWSXRayRecorderBuilder builder = AWSXRayRecorderBuilder.standard().withPlugin(new EC2Plugin()).withPlugin(new ElasticBeanstalkPlugin());
        URL ruleFile = WebConfig.class.getResource("/sampling-rules.json");
        builder.withSamplingStrategy(new LocalizedSamplingStrategy(ruleFile));
        AWSXRay.setGlobalRecorder(builder.build());
        AWSXRay.beginSegment("Scorekeep-init");
        if ( System.getenv("NOTIFICATION_EMAIL") != null ){
          try { Sns.createSubscription(); }
          catch (Exception e ) {
            logger.warn("Failed to create subscription for email "+  System.getenv("NOTIFICATION_EMAIL"));
          }
        }
        
        AWSXRay.endSegment();     logger.info("Setting up XRay Tracing Done");
    }
}