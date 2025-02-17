import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import {
  LoggerProvider,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs';

class OTelSDK {
  private readonly sdk: NodeSDK;
  private readonly loggerProvider: LoggerProvider;

  constructor(
    private readonly serviceName: string,
    private readonly loggerUrl: string,
    private readonly traceUrl: string,
  ) {
    const resource = new Resource({
      [ATTR_SERVICE_NAME]: serviceName,
    });

    // Trace exporter
    const traceExporter = new OTLPTraceExporter({
      url: traceUrl,
    });

    // Log exporter
    const logExporter = new OTLPLogExporter({
      url: loggerUrl,
    });
    this.loggerProvider = new LoggerProvider({ resource });

    // Attach the log exporter to the logger provider
    this.loggerProvider.addLogRecordProcessor(
      new SimpleLogRecordProcessor(logExporter),
    );

    this.sdk = new NodeSDK({
      resource,
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-nestjs-core': {
            enabled: true,
          },
        }),
      ],
    });

    process.on('SIGTERM', () => {
      this.sdk
        .shutdown()
        .then(
          () => console.log('OTel SDK shutdown successfully'),
          (err) => console.log('OTel SDK shutdown failed', err),
        )
        .finally(() => process.exit(0));
    });
  }

  async start() {
    await this.sdk.start();
  }

  getLoggerProvider() {
    return this.loggerProvider;
  }

  getServiceName() {
    return this.serviceName;
  }
}

export default OTelSDK;
