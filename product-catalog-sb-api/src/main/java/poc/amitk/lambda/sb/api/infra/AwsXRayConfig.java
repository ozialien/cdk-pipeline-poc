package poc.amitk.lambda.sb.api.infra;

import software.amazon.lambda.powertools.logging.LoggingUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
// import org.slf4j.MDC;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

// https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-java-aop-spring.html
@Configuration
public class AwsXRayConfig {
    // Create a logger instance
    private static final Logger logger = LoggerFactory.getLogger(AwsXRayConfig.class);

    public class CustomXRayServletFilter implements jakarta.servlet.Filter { 
        private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
        private static final String TRACE_ID_HEADER = "X-Amzn-Trace-Id";
        private static final String CORRELATION_ID_MDC_KEY = "correlation_id";
        private static final String TRACE_ID_MDC_KEY = "traceId";

        public CustomXRayServletFilter() {
            super();
        }

        @Override
        public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                throws IOException, ServletException {

            logger.info("CustomXRayServletFilter is beginning to process request: " + request.toString());

            HttpServletRequest httpRequest = (HttpServletRequest) request;
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
                // TracingUtils.putAnnotation(CORRELATION_ID_MDC_KEY, correlationId);
                if (amznTraceId != null && !amznTraceId.isEmpty()) {
                    LoggingUtils.appendKey(TRACE_ID_MDC_KEY, amznTraceId);
                }
                chain.doFilter(request, response);
            } finally {
                logger.info("CustomXRayServletFilter is finished processing request: " + request.toString());
                LoggingUtils.removeKey(TRACE_ID_MDC_KEY);
            }
        }
    }

    @Bean
    public FilterRegistrationBean<CustomXRayServletFilter> tracingFilter() {
        FilterRegistrationBean<CustomXRayServletFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(
                new CustomXRayServletFilter());
        registrationBean.addUrlPatterns("/*");
        registrationBean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registrationBean;
    }

}