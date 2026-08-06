/**
 * OpenTelemetry tracing bootstrap (runtime optional).
 *
 * To enable distributed tracing:
 *   pnpm add @opentelemetry/sdk-node @opentelemetry/exporter-otlp-proto
 *          @opentelemetry/instrumentation-http @opentelemetry/instrumentation-nestjs-core
 *          @opentelemetry/resources @opentelemetry/semantic-conventions
 *   Set env: OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
 *   Remove the @ts-ignore comments below.
 *
 * Dynamic imports wrapped in try/catch. @ts-ignore used because OTEL
 * packages are optional — the app compiles and runs without them.
 */

let bootstrapped = false;

export function isTracingEnabled(): boolean {
  return bootstrapped;
}

export async function bootstrapTracing(): Promise<void> {
  if (bootstrapped) return;
  const endpoint = typeof process !== 'undefined' ? process.env?.OTEL_EXPORTER_OTLP_ENDPOINT : undefined;
  if (!endpoint) return;

  try {
    // @ts-expect-error — optional OTEL packages
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    // @ts-expect-error — optional OTEL packages
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-otlp-proto');
    // @ts-expect-error — optional OTEL packages
    const { HttpInstrumentation } = await import('@opentelemetry/instrumentation-http');
    // @ts-expect-error — optional OTEL packages
    const { NestInstrumentation } = await import('@opentelemetry/instrumentation-nestjs-core');
    // @ts-expect-error — optional OTEL packages
    const { Resource } = await import('@opentelemetry/resources');
    // @ts-expect-error — optional OTEL packages
    const { SemanticResourceAttributes } = await import('@opentelemetry/semantic-conventions');

    const sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'tradingo-api',
        [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
      }),
      traceExporter: new OTLPTraceExporter({
        url: `${endpoint}/v1/traces`,
      }),
      instrumentations: [
        new HttpInstrumentation({
          headersToSpanAttributes: ['x-request-id', 'x-correlation-id'],
        }),
        new NestInstrumentation(),
      ],
    });

    sdk.start();
    bootstrapped = true;

    process.on('SIGTERM', () => void sdk.shutdown());
    process.on('SIGINT', () => void sdk.shutdown());
  } catch {
    // OTEL packages not available at runtime — tracing disabled
  }
}