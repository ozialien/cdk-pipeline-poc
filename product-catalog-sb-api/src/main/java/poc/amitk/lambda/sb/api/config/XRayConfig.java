    package poc.amitk.lambda.sb.api.config;

    import com.amazonaws.xray.AWSXRay;
    import com.amazonaws.xray.AWSXRayRecorder;
    import com.amazonaws.xray.spring.aop.XRayEnabled;

    import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
    import org.springframework.context.annotation.Bean;
    import org.springframework.context.annotation.Configuration;

    @Configuration
    @XRayEnabled  // Enables X-Ray tracing across beans in this configuration
    @ConditionalOnProperty(name = "tracing.enabled", havingValue = "true") 
    public class XRayConfig {

        @Bean
        public AWSXRayRecorder awsXRayRecorder() {
            return AWSXRay.getGlobalRecorder();  // Use the global recorder for tracing
        }
    }