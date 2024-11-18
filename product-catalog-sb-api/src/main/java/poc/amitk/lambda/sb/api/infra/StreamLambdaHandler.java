package poc.amitk.lambda.sb.api.infra;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.trace.Span;
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

/**
 * @author amitkapps
 */
public class StreamLambdaHandler implements RequestStreamHandler {
    private static final String CURRENT_CLASS_NAME = StreamLambdaHandler.class.getName();
    private static SpringBootLambdaContainerHandler<AwsProxyRequest, AwsProxyResponse> handler;
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
        logger.info("Entering {}.{}", CURRENT_CLASS_NAME, methodName);

        // Obtain a Tracer instance
        Tracer tracer = GlobalOpenTelemetry.getTracer("ProductCatalogService");

        // Start a new Span representing the handleRequest method
        Span span = tracer.spanBuilder(methodName).startSpan();

        // Make the span the current span
        try (Scope scope = span.makeCurrent()) {
            // Optionally, set attributes on the span
            span.setAttribute("class.name", CURRENT_CLASS_NAME);
            span.setAttribute("method.name", methodName);

            // Call the handler method
            handler.proxyStream(inputStream, outputStream, context);

        } catch (Exception e) {
            // Record the exception in the span
            span.recordException(e);
            span.setStatus(StatusCode.ERROR, "Exception in handleRequest");
            // Re-throw the exception to maintain the original behavior
            throw e;
        } finally {
            // End the span
            span.end();
            logger.info("Exiting {}.{}", CURRENT_CLASS_NAME, methodName);
        }
    }

}