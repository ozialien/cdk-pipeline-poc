package poc.amitk.lambda.sb.api.infra;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import poc.amitk.lambda.sb.api.ProductCatalogSbApiApplication;

/**
 * @author amitkapps
 */
public class StreamLambdaHandler implements RequestStreamHandler {
    private static SpringBootLambdaContainerHandler<AwsProxyRequest, AwsProxyResponse> handler;
    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    private static final String CORRELATION_ID_MDC_KEY = "correlationId";
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

    private String extractCorrelationId(InputStream inputStream) throws IOException {
        JsonNode eventNode = objectMapper.readTree(inputStream);
        JsonNode headersNode = eventNode.get("headers");
        if (headersNode != null && headersNode.has(CORRELATION_ID_HEADER)) {
            return headersNode.get(CORRELATION_ID_HEADER).asText();
        }
        return null;
    }

    @Override
    public void handleRequest(InputStream inputStream, OutputStream outputStream,
            Context context)
            throws IOException {

        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        inputStream.transferTo(byteArrayOutputStream);
        byte[] bytes = byteArrayOutputStream.toByteArray();
        InputStream inputStreamCopy1 = new ByteArrayInputStream(bytes);
        InputStream inputStreamCopy2 = new ByteArrayInputStream(bytes);

        ////
        //
        // Upstream somebody may have added one already
        //
        String correlationId = extractCorrelationId(inputStreamCopy1);

        ////
        //
        // If not then add a unique one and setup logging to show it
        //
        if (correlationId == null) {
            correlationId = context.getAwsRequestId();
        }
        MDC.put(CORRELATION_ID_MDC_KEY, correlationId);
        String methodName = new Exception().getStackTrace()[0].getMethodName();
        try {
            logger.info("Entering {}.{}", CURRENT_CLASS_NAME, methodName);
            String traceId = AWSXRay.getCurrentSegment().getTraceId().toString();
            logger.info("Trace ID: {}", traceId);
            handler.proxyStream(inputStreamCopy2, outputStream, context);
        } finally {
            logger.info("Exiting {}.{}", CURRENT_CLASS_NAME, methodName);
            MDC.remove(CORRELATION_ID_MDC_KEY);
        }
    }
}
