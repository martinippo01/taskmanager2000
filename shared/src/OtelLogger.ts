import { ConsoleLogger } from "@nestjs/common";
import OTelSDK from "./Tracing";
import { SeverityNumber } from "@opentelemetry/api-logs";

class OtelLogger extends ConsoleLogger {
  private readonly logger;

  constructor(otelSdk: OTelSDK) {
    super();
    this.logger = otelSdk
      .getLoggerProvider()
      .getLogger(otelSdk.getServiceName());
  }

  log(message: any, context?: string, ...rest: unknown[]): void {
    super.log(message, context, ...rest);
    this.logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
      body: message,
      attributes: { context: context || "" },
    });
  }

  error(message: any, context?: string, ...rest: unknown[]): void {
    super.error(message, context, ...rest);
    this.logger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: "ERROR",
      body: message,
      attributes: { context: context || "" },
    });
  }

  warn(message: any, context?: string, ...rest: unknown[]): void {
    super.warn(message, context, ...rest);
    this.logger.emit({
      severityNumber: SeverityNumber.WARN,
      severityText: "WARN",
      body: message,
      attributes: { context: context || "" },
    });
  }
}

export default OtelLogger;
