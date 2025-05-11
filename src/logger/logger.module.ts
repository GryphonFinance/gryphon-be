import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const env = process.env.NODE_ENV || 'development';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

const createTransport = (level: string) =>
  new DailyRotateFile({
    level,
    dirname: path.join('logs', level),
    filename: `%DATE%.${level}.log`, // filename will still be in YYYY-MM-DD
    datePattern: 'DD-MM-YYYY',       // this controls rotation naming
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
  });

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        ...(env === 'development'
          ? [
              new winston.transports.Console({
                format: winston.format.combine(
                  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                  nestWinstonModuleUtilities.format.nestLike('App', {
                    colors: true,
                    prettyPrint: true,
                  })
                ),
              }),
            ]
          : [
              createTransport('http'),
              createTransport('info'),
              createTransport('error'),
            ]),
      ],
    }),
  ],
})
export class LoggerModule {}
