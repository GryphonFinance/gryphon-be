import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const env = process.env.NODE_ENV || 'development';

    if (env === 'development') {
      morgan('dev')(req, res, next); // colorized console logs
    } else {
      const logDir = path.join('logs', 'http');
      fs.mkdirSync(logDir, { recursive: true });

      const stream = fs.createWriteStream(
        path.join(logDir, `${new Date().toISOString().slice(0, 10)}.http.log`),
        { flags: 'a' }
      );

      morgan(':date[iso] :method :url :status :res[content-length] - :response-time ms', {
        stream,
      })(req, res, next);
    }
  }
}
