package poc.amitk.lambda.sb.api.infra;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import org.slf4j.MDC;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanContext;
import io.opentelemetry.api.trace.StatusCode;
import io.opentelemetry.api.trace.Tracer;
import io.opentelemetry.context.Scope;
import com.amazonaws.serverless.exceptions.ContainerInitializationException;
import com.amazonaws.serverless.proxy.model.AwsProxyRequest;
import com.amazonaws.serverless.proxy.model.AwsProxyResponse;
import com.amazonaws.serverless.proxy.spring.SpringBootLambdaContainerHandler;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestStreamHandler;
import poc.amitk.lambda.sb.api.ProductCatalogSbApiApplication;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * @author amitkapps
 */
public class StreamLambdaHandler implements RequestStreamHandler {
    private static final String CORRELATION_ID_HEADER = "X-Correlation-ID";
    private static final String CORRELATION_ID_MDC_KEY = "correlationId";
    private static final String CURRENT_CLASS_NAME = StreamLambdaHandler.class.getName();
    private static SpringBootLambdaContainerHandler<AwsProxyRequest, AwsProxyResponse> handler;
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final Logger logger = LoggerFactory.getLogger(StreamLambdaHandler.class);
    
    static {
        try {
            handler = SpringBootLambdaContainerHandler.getAwsProxyHandler(ProductCatalogSbApiApplication.class);
        } catch (ContainerInitializationException e) {
            e.printStackTrace();
            throw new RuntimeException("Could not initialize Spring Boot application", e);
        }
    }

    @Override
    public void handleRequest(InputStream inputStream, OutputStream outputStream,
            Context context)
            throws IOException {

        // Log entering the method
        String methodName = Thread.currentThread().getStackTrace()[1].getMethodName();


        ////
        //
        // Start Business Correlation
        //        
        ByteArrayOutputStream cachedStream = new ByteArrayOutputStream();
        inputStream.transferTo(cachedStream);
        byte[] inputBytes = cachedStream.toByteArray();
        InputStream cachedInputForHeaders = new ByteArrayInputStream(inputBytes);
        InputStream cachedInputForHandler = new ByteArrayInputStream(inputBytes);

        logger.info("Received JSON data: {}", new String(inputBytes,
                StandardCharsets.UTF_8));

        AwsProxyRequest request = objectMapper.readValue(cachedInputForHeaders,
                AwsProxyRequest.class);

        String correlationId = request.getHeaders().getOrDefault(CORRELATION_ID_HEADER, null);
        // Put the correlation ID into MDC
        if (correlationId == null) {
            correlationId = context.getAwsRequestId();
        }

        MDC.put(CORRELATION_ID_MDC_KEY, correlationId);
        logger.info("Entering {}.{}", CURRENT_CLASS_NAME, methodName);        
        //
        // End Business Correlation setup
        ////
    
        try {
            // Call the handler method
            handler.proxyStream(cachedInputForHandler, outputStream, context);
        } catch (Exception e) {
            logger.error("Error occurred", e);
            throw e;
        } finally {
            logger.info("Exiting {}.{}", CURRENT_CLASS_NAME, methodName);
            // End the span
            MDC.remove(CORRELATION_ID_MDC_KEY);
        }
    }

}