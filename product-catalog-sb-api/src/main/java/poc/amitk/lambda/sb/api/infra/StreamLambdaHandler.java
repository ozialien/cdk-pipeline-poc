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
import com.amazonaws.xray.entities.Segment;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import poc.amitk.lambda.sb.api.ProductCatalogSbApiApplication;

/**
 * @author amitkapps
 */
public class StreamLambdaHandler implements RequestStreamHandler {
    private static SpringBootLambdaContainerHandler<AwsProxyRequest, AwsProxyResponse> handler;
    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    private static final String TRACE_ID_HEADER = "X-Amzn-Trace-Id";
    private static final String CORRELATION_ID_MDC_KEY = "correlationId";
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
    public void handleRequest(InputStream inputStream, OutputStream outputStream,
            Context context)
            throws IOException {

        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        inputStream.transferTo(byteArrayOutputStream);
        byte[] bytes = byteArrayOutputStream.toByteArray();
        InputStream inputStreamCopy1 = new ByteArrayInputStream(bytes);
        InputStream inputStreamCopy2 = new ByteArrayInputStream(bytes);

        String correlationId = null;
        String traceId = null;
        JsonNode eventNode = objectMapper.readTree(inputStreamCopy1);
        JsonNode headersNode = eventNode.get("headers");

        if (headersNode != null && headersNode.has(CORRELATION_ID_HEADER)) {
            correlationId = headersNode.get(CORRELATION_ID_HEADER).asText();
        }
        if (correlationId == null) {
            correlationId = context.getAwsRequestId();
        }
        MDC.put(CORRELATION_ID_MDC_KEY, correlationId);

        Segment segment = null;
        if (headersNode != null && headersNode.has(TRACE_ID_HEADER)) {
            traceId = headersNode.get(TRACE_ID_HEADER).asText();
            logger.info("Fetched traceId from API Gateway Proxy Header: {}", traceId);
            segment = AWSXRay.beginSegment("ProductCatalogService");

        }

        if (traceId != null) {
            MDC.put(TRACE_ID_MDC_KEY, correlationId);
        }

        String methodName = new Exception().getStackTrace()[0].getMethodName();

        try {
            logger.info("Entering {}.{}", CURRENT_CLASS_NAME, methodName);
            handler.proxyStream(inputStreamCopy2, outputStream, context);
        } catch (Exception e) {
            if (segment != null) {
                segment.addException(e);
            }
            throw e;
        } finally {
            if (segment != null) {
                AWSXRay.endSegment();
            }
            logger.info("Exiting {}.{}", CURRENT_CLASS_NAME, methodName);
            MDC.remove(CORRELATION_ID_MDC_KEY);
        }
    }
}
