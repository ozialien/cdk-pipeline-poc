package poc.amitk.lambda.sb.api.infra;

import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.AWSXRayRecorder;
import com.amazonaws.xray.javax.servlet.AWSXRayServletFilter;
import com.amazonaws.xray.spring.aop.XRayEnabled;

import poc.amitk.lambda.sb.api.ProductCatalogSbApiApplication;

import javax.servlet.Filter;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@XRayEnabled // Enables X-Ray tracing across beans in this configuration
@ConditionalOnProperty(name = "xray.tracing.enabled", havingValue = "true")
public class XRayConfig {
/* 
    @Bean
    public AWSXRayRecorder awsXRayRecorder() {
        return AWSXRay.getGlobalRecorder(); // Use the global recorder for tracing
    }
*/
    @Bean
    public Filter TracingFilter() {
        return new AWSXRayServletFilter(ProductCatalogSbApiApplication.class.getName());
    }
}