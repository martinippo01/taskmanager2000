import { Injectable, Provider } from '@nestjs/common';
import {
  context,
  Span,
  SpanStatusCode,
  trace,
  Tracer,
} from '@opentelemetry/api';

export interface TracerGateway {
  trace: <Response>(
    name: string,
    callback: (span: Span) => Promise<Response> | Response,
    onError?: (error: unknown) => void,
  ) => Promise<Response> | Response;
}

export const TracerGateway = Symbol('TracerGateway');

@Injectable()
export class TracerGatewayImpl implements TracerGateway {
  private readonly tracer: Tracer;

  constructor(serviceName: string) {
    this.tracer = trace.getTracer(serviceName);
  }

  public trace<Response>(
    name: string,
    callback: (span: Span) => Promise<Response> | Response,
    onError?: (error: unknown) => void,
  ): Promise<Response> | Response {
    return this.tracer.startActiveSpan(name, async (span) => {
      try {
        const response = await context.with(
          trace.setSpan(context.active(), span),
          async () => {
            return callback(span);
          },
        );
        span.setStatus({
          code: SpanStatusCode.OK,
        });
        return response;
      } catch (error) {
        if (onError) {
          onError(error);
        }
        const message = error instanceof Error ? error.message : String(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message,
        });
        throw error;
      } finally {
        span.end();
      }
    });
  }
}

export class TracerGatewayMock implements TracerGateway {
  public trace<Response>(
    name: string,
    callback: (span: Span) => Promise<Response> | Response,
    onError?: (error: unknown) => void,
  ): Promise<Response> | Response {
    const span: jest.Mocked<Span> = {
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      end: jest.fn(),
      addEvent: jest.fn(),
      addLink: jest.fn(),
      addLinks: jest.fn(),
      isRecording: jest.fn(),
      recordException: jest.fn(),
      updateName: jest.fn(),
      setAttributes: jest.fn(),
      spanContext: jest.fn(),
    };
    return callback(span);
  }
}

export const tracerGatewayProvider: Provider = {
  provide: TracerGateway,
  useFactory: () => new TracerGatewayImpl(process.env.SERVICE_NAME!),
};

export const tracerGatewayMockProvider: Provider = {
  provide: TracerGateway,
  useClass: TracerGatewayMock,
};
