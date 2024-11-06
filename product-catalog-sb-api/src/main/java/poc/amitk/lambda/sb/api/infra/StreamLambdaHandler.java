package poc.amitk.lambda.sb.api.infra;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.amazonaws.serverless.exceptions.ContainerInitializationException;
import com.amazonaws.serverless.proxy.model.AwsProxyRequest;
import com.amazonaws.serverless.proxy.model.AwsProxyResponse;
import com.amazonaws.serverless.proxy.spring.SpringBootLambdaContainerHandler;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestStreamHandler;
import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Segment;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import poc.amitk.lambda.sb.api.ProductCatalogSbApiApplication;

/**
 * @author amitkapps
 */
public class StreamLambdaHandler implements RequestStreamHandler {
    private static SpringBootLambdaContainerHandler<AwsProxyRequest, AwsProxyResponse> handler;
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

    /**
     * 
     * Being able to dynamically switch on and off XRay tracing via the api gateway
     * trace header
     * is apparently a cost save.
     * Even when XRay tracing is switched on in Lambda you can ihitiate a full trace
     * this way.
     * 
     * Recorded traces: $5 per million traces recorded
     * Retrieved traces: $0.50 per million traces retrieved
     * Scanned traces: $0.50 per million traces scanned
     * X-Ray Insights traces stored: $1 per million traces recorded
     * Sampling rate: The chosen sampling rate is multiplied by the request or API
     * call rate to estimate costs
     * 
     * 
     * @param inputStream
     * @param outputStream
     * @param context
     * @throws IOException
     */
    @Override
    public void handleRequest(InputStream inputStream, OutputStream outputStream, Context context)
            throws IOException {
        String methodName = new Exception().getStackTrace()[0].getMethodName();
        logger.info("Entering {}.{}", this.getClass().getName(), methodName);

        ByteArrayOutputStream cachedStream = new ByteArrayOutputStream();
        inputStream.transferTo(cachedStream);
        byte[] inputBytes = cachedStream.toByteArray();
        InputStream cachedInputForHeaders = new ByteArrayInputStream(inputBytes);
        InputStream cachedInputForHandler = new ByteArrayInputStream(inputBytes);
        
        logger.info("Received JSON data: {}", new String(inputBytes, StandardCharsets.UTF_8));

        Map<String, Object> requestMap = objectMapper.readValue(
                cachedInputForHeaders,
                new TypeReference<Map<String, Object>>() {
                });
        logger.info("Parsed Map: %{}", requestMap);

        ////
        //
        // There seems to be a spring boot and amazon library dependency
        // mismatch. Rather than track it down for now just use the
        // generic Map parse and switch on that. It does raise an important
        // question though.
        //
        // Deserialization to check proxy requests could fail when AWS upgrades.
        //
        // AwsProxyRequest request = objectMapper.readValue(cachedInputForHeaders, AwsProxyRequest.class);
        // String traceHeader = request.getHeaders().get("X-Amzn-Trace-Id");
        //
        ////

        @SuppressWarnings("unchecked")
        Map<String, String> headers = (Map<String, String>) requestMap.getOrDefault("headers", null);
        String traceHeader = headers != null ? headers.get("X-Amzn-Trace-Id") : null;
        logger.info("X-Amzn-Trace-Id: {}", traceHeader);

        Segment segment = null;

        if (traceHeader != null) {
            // If tracing header is present, start a new X-Ray segment for this request
            segment = AWSXRay.beginSegment("ProductCatalogService");
        }

        try {
            // Forward the request to the handler
            handler.proxyStream(cachedInputForHandler, outputStream, context);
        } catch (Exception e) {
            if (segment != null) {
                segment.addException(e);
            }
            throw e;
        } finally {
            // End the segment if it was started
            if (segment != null) {
                AWSXRay.endSegment();
            }
            logger.info("Exiting {}.{}", this.getClass().getName(), methodName);

        }
    }
}