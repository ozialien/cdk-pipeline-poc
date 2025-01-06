package poc.amitk.lambda.sb.api.infra;

import java.net.URL;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.AWSXRayRecorderBuilder;
import com.amazonaws.xray.jakarta.servlet.AWSXRayServletFilter;
import com.amazonaws.xray.strategy.jakarta.SegmentNamingStrategy;
import com.amazonaws.xray.strategy.sampling.LocalizedSamplingStrategy;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.Filter;

// https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-java.html
// https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-java-aop-spring.html#xray-sdk-java-aop-annotate-or-implement
@Configuration
public class TracingConfig {
    // Create a logger instance
    private static final Logger logger = LoggerFactory.getLogger(TracingConfig.class);

    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public Filter TracingFilter() {
        return new AWSXRayServletFilter(SegmentNamingStrategy.dynamic("MatsonTest"));
    }

    /*
     * @Bean
     * 
     * @Order(Ordered.HIGHEST_PRECEDENCE);
     * public FilterRegistrationBean<AWSXRayServletFilter> tracingFilter() {
     * logger.debug("Setting up tracingFilter");
     * FilterRegistrationBean<AWSXRayServletFilter> registrationBean = new
     * FilterRegistrationBean<>();
     * registrationBean.setFilter(new
     * AWSXRayServletFilter(SegmentNamingStrategy.dynamic("MatsonTest")));
     * registrationBean.addUrlPatterns("/*");
     * registrationBean.setOrder(Ordered.HIGHEST_PRECEDENCE);
     * logger.debug("Setting up tracingFilter Done");
     * return registrationBean;
     * }
     */

    @PostConstruct
    public void init() {
        logger.info("Setting up XRay Tracing");
        AWSXRayRecorderBuilder builder = AWSXRayRecorderBuilder.standard();
        URL ruleFile = TracingConfig.class.getResource("/sampling-rules.json");
        builder.withSamplingStrategy(new LocalizedSamplingStrategy(ruleFile));
        AWSXRay.setGlobalRecorder(builder.build());
        logger.info("Setting up XRay Tracing Done");
    }

}