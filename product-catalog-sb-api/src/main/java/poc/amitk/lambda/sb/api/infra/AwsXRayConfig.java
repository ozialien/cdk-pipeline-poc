package poc.amitk.lambda.sb.api.infra;

import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.AWSXRayRecorder;
import com.amazonaws.xray.AWSXRayRecorderBuilder;
import com.amazonaws.xray.entities.Segment;
import com.amazonaws.xray.jakarta.servlet.AWSXRayServletFilter;
import com.amazonaws.xray.strategy.jakarta.SegmentNamingStrategy;
import com.amazonaws.xray.strategy.sampling.LocalizedSamplingStrategy;

import io.micrometer.common.lang.Nullable;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;
import java.net.URL;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableAutoConfiguration
@ConditionalOnProperty(name = "xray.tracing.enabled", havingValue = "true")
public class AwsXRayConfig {
    // Create a logger instance
    private static final Logger logger = LoggerFactory.getLogger(StreamLambdaHandler.class);

    public class CustomXRayServletFilter extends AWSXRayServletFilter {
        private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
        private static final String TRACE_ID_HEADER = "X-Amzn-Trace-Id";
        private static final String CORRELATION_ID_MDC_KEY = "correlationId";
        private static final String TRACE_ID_MDC_KEY = "traceId";

        public CustomXRayServletFilter() {
            super((SegmentNamingStrategy) null);
        }

        public CustomXRayServletFilter(String fixedSegmentName) {
            super(SegmentNamingStrategy.fixed(fixedSegmentName));
        }

        public CustomXRayServletFilter(@Nullable SegmentNamingStrategy segmentNamingStrategy) {
            super(segmentNamingStrategy, null);
        }

        @Override
        public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                throws IOException, ServletException {

            if (logger.isDebugEnabled()) {
                logger.debug("CustomXRayServletFilter is beginning to process request: " + request.toString());
            }
            HttpServletRequest httpRequest = (HttpServletRequest) request;
            try {
                // Retrieve the X-Correlation-ID header
                String correlationId = httpRequest.getHeader(CORRELATION_ID_HEADER);
                // Retrieve the X-Amzn-Trace-Id header
                String amznTraceId = httpRequest.getHeader(TRACE_ID_HEADER);
                // Optionally, add these IDs to the logging context
                if (correlationId != null && !correlationId.isEmpty()) {
                    MDC.put(CORRELATION_ID_MDC_KEY, correlationId);
                }
                if (amznTraceId != null && !amznTraceId.isEmpty()) {
                    MDC.put(TRACE_ID_MDC_KEY, amznTraceId);
                }
                super.doFilter(request, response, chain);
            } finally {
                if (logger.isDebugEnabled()) {
                    logger.debug("CustomXRayServletFilter is finished processing request: " + request.toString());
                }
                // Clean up the MDC to prevent data leakage between threads
                MDC.remove(CORRELATION_ID_MDC_KEY);
                MDC.remove(TRACE_ID_MDC_KEY);
            }
        }

    }

    ////
    //
    // Thits posed problems given that javax.servlet.Filter isn't provided for
    //// SpringBoot
    // 3.x services.
    //
    @Bean
    public CustomXRayServletFilter TracingFilter() {
        CustomXRayServletFilter xrayFilter = new AwsXRayConfig.CustomXRayServletFilter("ProductCatalogService");
        return xrayFilter;
    }

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