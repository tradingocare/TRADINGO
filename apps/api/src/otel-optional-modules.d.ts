// Optional OpenTelemetry packages: ambient shorthand declarations.
// These packages are lazily loaded at runtime (see tracing.ts) and may be
// absent from any given install layout (isolated or --shamefully-hoisted).
// Resolving them to `any` here keeps compilation deterministic in every
// layout. Do NOT reintroduce @ts-expect-error in tracing.ts: hoisted
// transitive copies (via Sentry) make resolution layout-dependent, which
// turns expect-error directives into TS2578 failures.
declare module '@opentelemetry/sdk-node';
declare module '@opentelemetry/exporter-otlp-proto';
declare module '@opentelemetry/instrumentation-http';
declare module '@opentelemetry/instrumentation-nestjs-core';
declare module '@opentelemetry/resources';
declare module '@opentelemetry/semantic-conventions';
