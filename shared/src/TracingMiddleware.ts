import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { TracerGateway } from './TracerGateway';

@Injectable()
class TracingMiddleware implements NestMiddleware {
  constructor(
    @Inject(TracerGateway) private readonly tracerGateway: TracerGateway,
  ) {}

  use(req: any, res: any, next: (error?: Error | any) => void) {
    this.tracerGateway.trace('http_request', async (span) => {
      span.setAttribute('http.method', req.method);
      span.setAttribute('http.url', req.url);
      span.setAttribute('http.user_agent', req.headers['user-agent']);
      span.setAttribute('http.host', req.headers['host']);
      span.setAttribute('http.remote_addr', req.connection.remoteAddress);
      return new Promise<void>((resolve) => {
        res.on('finish', () => {
          span.setAttribute('http.status_code', res.statusCode);
          resolve();
        });
        next();
      });
    });
  }
}

export default TracingMiddleware;
