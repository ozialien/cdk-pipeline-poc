package poc.amitk.lambda.sb.api.infra;

import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.AWSXRayRecorder;
import com.amazonaws.xray.AWSXRayRecorderBuilder;
import com.amazonaws.xray.spring.aop.XRayEnabled;
import com.amazonaws.xray.strategy.DynamicSegmentNamingStrategy;
import com.amazonaws.xray.strategy.FixedSegmentNamingStrategy;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@XRayEnabled // Enables X-Ray tracing across beans in this configuration
@ConditionalOnProperty(name = "xray.tracing.enabled", havingValue = "true")
public class XRayConfig {

    @Bean
    public AWSXRayRecorder awsXRayRecorder() {
        AWSXRay.setGlobalRecorder(AWSXRayRecorderBuilder.standard().build());
        return AWSXRay.getGlobalRecorder();
        }
}