import { NodeSDK } from "@opentelemetry/sdk-node";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

class OTelSDK {
  private readonly sdk: NodeSDK;

  constructor(serviceName: string, exporterUrl: string) {
    const exporterOptions = {
      url: exporterUrl,
    };

    const traceExporter = new OTLPTraceExporter(exporterOptions);

    this.sdk = new NodeSDK({
      resource: new Resource({
        [ATTR_SERVICE_NAME]: serviceName,
      }),
      traceExporter,
      instrumentations: [getNodeAutoInstrumentations()],
    });

    process.on("SIGTERM", () => {
      this.sdk
        .shutdown()
        .then(
          () => console.log("OTel SDK shutdown successfully"),
          (err) => console.log("OTel SDK shutdown failed", err)
        )
        .finally(() => process.exit(0));
    });
  }

  async start() {
    await this.sdk.start();
  }
}

export default OTelSDK;
