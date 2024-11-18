package poc.amitk.lambda.sb.api.infra;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class OpenTelemetryConfig {

    @Value("${tracing.enabled:true}")
    private boolean tracingEnabled;

    @Value("${otel.traces.exporter:otlp}")
    private String tracesExporter;

    @Value("${otel.exporter.otlp.endpoint:http://localhost:4317}")
    private String otlpEndpoint;

    @PostConstruct
    public void init() {
        if (tracingEnabled) {
            System.setProperty("otel.traces.exporter", tracesExporter);
            System.setProperty("otel.exporter.otlp.endpoint", otlpEndpoint);
        } else {
            System.setProperty("otel.traces.exporter", "none");
        }
    }
}
