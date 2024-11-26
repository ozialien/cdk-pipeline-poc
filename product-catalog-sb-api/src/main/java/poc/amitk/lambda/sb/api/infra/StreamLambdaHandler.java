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
import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Entity;
import com.fasterxml.jackson.databind.ObjectMapper;

import poc.amitk.lambda.sb.api.ProductCatalogSbApiApplication;
import software.amazon.lambda.powertools.logging.Logging;
import software.amazon.lambda.powertools.tracing.Tracing;

/**
 * @author amitkapps
 */

public class StreamLambdaHandler implements RequestStreamHandler {
    private static SpringBootLambdaContainerHandler<AwsProxyRequest, AwsProxyResponse> handler;
    private static final String TRACE_ID_HEADER = "X-Amzn-Trace-Id";
    private static final String CORRELATION_ID_MDC_KEY = "correlation_id"; // Powertools name
    private static final String TRACE_ID_MDC_KEY = "traceId";
    private static final String CURRENT_CLASS_NAME = StreamLambdaHandler.class.getName();
    private static final ObjectMapper objectMapper = new ObjectMapper();

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

    @Override
    @Tracing(segmentName = "ProductCatalogService")
    @Logging(correlationIdPath = "headers.X-Correlation-ID", logEvent = true)
    public void handleRequest(InputStream inputStream, OutputStream outputStream, Context context)
            throws IOException {
        String methodName = new Exception().getStackTrace()[0].getMethodName();

        // Retrieve the X-Ray Trace ID and add it to MDC
        Entity currentEntity = AWSXRay.getTraceEntity();
        if (currentEntity != null) {
            String traceId = currentEntity.getTraceId().toString();
            MDC.put(TRACE_ID_MDC_KEY, traceId);
        } else {
            logger.warn("No X-Ray entity found");
            MDC.put(TRACE_ID_MDC_KEY, "no-trace");
        }
        // Log method entry
        logger.info("Entering {}.{}", CURRENT_CLASS_NAME, methodName);
        try {
            // Process the event
            // Pass the original event node or recreate the InputStream if necessary
            // Your processing logic here
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
