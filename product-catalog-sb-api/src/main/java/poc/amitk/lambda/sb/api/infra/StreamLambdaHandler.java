package poc.amitk.lambda.sb.api.infra;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import com.amazonaws.serverless.exceptions.ContainerInitializationException;
import com.amazonaws.serverless.proxy.model.AwsProxyRequest;
import com.amazonaws.serverless.proxy.model.AwsProxyResponse;
import com.amazonaws.serverless.proxy.spring.SpringBootLambdaContainerHandler;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestStreamHandler;
import poc.amitk.lambda.sb.api.ProductCatalogSbApiApplication;
import software.amazon.lambda.powertools.logging.Logging;
import software.amazon.lambda.powertools.tracing.Tracing;

/**
 * @author amitkapps
 */

public class StreamLambdaHandler implements RequestStreamHandler {
    private static SpringBootLambdaContainerHandler<AwsProxyRequest, AwsProxyResponse> handler;
    private static final String TRACE_ID_MDC_KEY = "traceId";
    // This is per the powertools prior to this I set this to a custom name
    private static final String CORRELATION_ID_MDC_KEY = "correlation_id";

    private static final String CURRENT_CLASS_NAME = StreamLambdaHandler.class.getName();

    // Create a logger instance
    private static final Logger logger = LoggerFactory.getLogger(StreamLambdaHandler.class);

    static {
        try {
            handler = SpringBootLambdaContainerHandler.getAwsProxyHandler(ProductCatalogSbApiApplication.class);
            // If you are using HTTP APIs with the version 2.0 of the proxy model, use the
            // getHttpApiV2ProxyHandler
            // method: handler =
            // SpringBootLambdaContainerHandler.getHttpApiV2ProxyHandler(Application.class);
        } catch (ContainerInitializationException e) {
            // if we fail here. We re-throw the exception to force another cold start
            e.printStackTrace();
            throw new RuntimeException("Could not initialize Spring Boot application", e);
        }
    }

    private String getTraceId() {
        String xAmznTraceId = System.getenv("_X_AMZN_TRACE_ID");
        String methodName = new Exception().getStackTrace()[0].getMethodName();
        logger.info("Exiting {}.{} _X_AMZN_TRACE_ID=", CURRENT_CLASS_NAME, methodName, xAmznTraceId);
        if (xAmznTraceId != null) {
            for (String part : xAmznTraceId.split(";")) {
                if (part.startsWith("Root=")) {
                    return part.substring(5); // Extract the Trace ID after 'Root='
                }
            }
        }
        return "no-trace-id";
    }

    @Override
    @Tracing(segmentName = "ProductCatalogService")
    @Logging(correlationIdPath = "headers.X-Correlation-Id", logEvent = true)
    public void handleRequest(InputStream inputStream, OutputStream outputStream, Context context)
            throws IOException {
        String methodName = new Exception().getStackTrace()[0].getMethodName();
        MDC.put(TRACE_ID_MDC_KEY, getTraceId());
        String correlationId = MDC.get(CORRELATION_ID_MDC_KEY);
        if (correlationId == null) {
            logger.info("Correlation not found in header adding it from lambda");
            correlationId = context.getAwsRequestId();
            MDC.put(CORRELATION_ID_MDC_KEY, correlationId);
        }
        logger.info("Correlation Id: {}", correlationId);
        logger.info("Entering {}.{}", CURRENT_CLASS_NAME, methodName);
        try {
            handler.proxyStream(inputStream, outputStream, context);
        } catch (Exception e) {
            // Powertools Tracing automatically captures exceptions
            logger.error("An error occurred", e);
            throw e;
        } finally {
            // Log method exit
            logger.info("Exiting {}.{}", CURRENT_CLASS_NAME, methodName);
            // No need to manually manage MDC or X-Ray segments
        }
    }

}
