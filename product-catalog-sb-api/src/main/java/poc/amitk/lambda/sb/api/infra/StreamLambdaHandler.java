package poc.amitk.lambda.sb.api.infra;

import com.amazonaws.serverless.exceptions.ContainerInitializationException;
import com.amazonaws.serverless.proxy.model.AwsProxyRequest;
import com.amazonaws.serverless.proxy.model.AwsProxyResponse;
import com.amazonaws.serverless.proxy.spring.SpringBootLambdaContainerHandler;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestStreamHandler;
import com.amazonaws.xray.AWSXRay;
import com.amazonaws.xray.entities.Segment;
import poc.amitk.lambda.sb.api.ProductCatalogSbApiApplication;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * @author amitkapps
 */
public class StreamLambdaHandler implements RequestStreamHandler {
    private static SpringBootLambdaContainerHandler<AwsProxyRequest, AwsProxyResponse> handler;
    private static final ObjectMapper objectMapper = new ObjectMapper();

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
     * Being able to dynamically switch on and off XRay tracing via the api gateway trace header
     * is apparently a cost save.
     * Even when XRay tracing is switched on in Lambda you can ihitiate a full trace this way.
     * 
     * Recorded traces: $5 per million traces recorded
     * Retrieved traces: $0.50 per million traces retrieved
     * Scanned traces: $0.50 per million traces scanned
     * X-Ray Insights traces stored: $1 per million traces recorded
     * Sampling rate: The chosen sampling rate is multiplied by the request or API call rate to estimate costs 
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

        // Parse the input stream to access headers
        AwsProxyRequest request = objectMapper.readValue(inputStream, AwsProxyRequest.class);
        String traceHeader = request.getHeaders().get("X-Amzn-Trace-Id");



        Segment segment = null;
        
        if (traceHeader != null) {
            // If tracing header is present, start a new X-Ray segment for this request
            segment = AWSXRay.beginSegment("ProductCatalogService");
        }

        try {
            // Forward the request to the handler
            handler.proxyStream(inputStream, outputStream, context);
        } finally {
            // End the segment if it was started
            if (segment != null) {
                AWSXRay.endSegment();
            }
        }
    }
}