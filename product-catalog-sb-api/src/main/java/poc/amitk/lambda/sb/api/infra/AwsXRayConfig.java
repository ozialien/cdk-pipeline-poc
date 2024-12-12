package poc.amitk.lambda.sb.api.infra;

import software.amazon.lambda.powertools.logging.LoggingUtils;
import software.amazon.lambda.powertools.tracing.TracingUtils;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import com.amazonaws.xray.jakarta.servlet.AWSXRayServletFilter;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
// import org.slf4j.MDC;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Subsegment;

// https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-java-aop-spring.html
@Configuration
public class AwsXRayConfig {
    // Create a logger instance
    private static final Logger logger = LoggerFactory.getLogger(AwsXRayConfig.class);

    public class SubSegmentFilter implements jakarta.servlet.Filter {
        private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
        private static final String TRACE_ID_HEADER = "X-Amzn-Trace-Id";
        private static final String CORRELATION_ID_MDC_KEY = "correlation_id";
        private static final String TRACE_ID_MDC_KEY = "traceId";
        private String subSegmentName = "ERNEST";

        public SubSegmentFilter() {
            super();
        }
        public SubSegmentFilter(String name) {
            this();
            this.subSegmentName = name;
        }
        

        @Override
        public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                throws IOException, ServletException {

            logger.info("CustomXRayServletFilter is beginning to process request: " + request.toString());

            HttpServletRequest httpRequest = (HttpServletRequest) request;

            Subsegment subsegment = AWSXRay.beginSubsegment(this.subSegmentName);
            try {
                // Retrieve the X-Correlation-ID header
                String correlationId = httpRequest.getHeader(CORRELATION_ID_HEADER);
                // Retrieve the X-Amzn-Trace-Id header
                String amznTraceId = httpRequest.getHeader(TRACE_ID_HEADER);
                // Optionally, add these IDs to the logging context
                if (correlationId != null && !correlationId.isEmpty()) {
                    // NOP
                } else {
                    correlationId = request.getRequestId();
                }
                LoggingUtils.setCorrelationId(correlationId);
                TracingUtils.putAnnotation(CORRELATION_ID_MDC_KEY, correlationId);
                if (amznTraceId != null && !amznTraceId.isEmpty()) {
                    LoggingUtils.appendKey(TRACE_ID_MDC_KEY, amznTraceId);
                    TracingUtils.putAnnotation(TRACE_ID_MDC_KEY, amznTraceId);
                }
                chain.doFilter(request, response);
            } finally {
                logger.info("CustomXRayServletFilter is finished processing request: " + request.toString());
                LoggingUtils.removeKey(TRACE_ID_MDC_KEY);
                AWSXRay.endSubsegment(subsegment);
            }
        }
    }

    @Bean
    public FilterRegistrationBean<SubSegmentFilter> subSegmentFilter() {
        logger.debug("Setting up SubSegmentFilter");
        FilterRegistrationBean<SubSegmentFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new SubSegmentFilter("ERNEST"));

        registrationBean.addUrlPatterns("/*");
        registrationBean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        logger.debug("Setting up SubSegmentFilter Done");
        return registrationBean;
    }

    @Bean
    public FilterRegistrationBean<AWSXRayServletFilter> tracingFilter() {
        logger.debug("Setting up tracingFilter");
        FilterRegistrationBean<AWSXRayServletFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(new AWSXRayServletFilter("ProductCatalogService"));
        registrationBean.addUrlPatterns("/*");
        registrationBean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        logger.debug("Setting up tracingFilter Done");
        return registrationBean;
    }
    /*
     * @PostConstruct
     * public void init() {
     * logger.info("Setting up XRay Tracing");
     * AWSXRayRecorderBuilder builder = AWSXRayRecorderBuilder.standard();
     * URL ruleFile = AwsXRayConfig.class.getResource("/sampling-rules.json");
     * builder.withSamplingStrategy(new LocalizedSamplingStrategy(ruleFile));
     * AWSXRay.setGlobalRecorder(`builder.build());
     * logger.info("Setting up XRay Tracing Done");
     * }
     */
}