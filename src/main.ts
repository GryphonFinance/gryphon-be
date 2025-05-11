import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './interceptors/response.iterceptor';
import { HttpLoggerMiddleware } from './logger/logger.middleware';
import cookieParser from 'cookie-parser';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: true, // or ['http://localhost:3000', 'https://yourfrontend.com']
    credentials: true, // allow cookies (important for jwt in httpOnly cookie)
  });

  app.use(new HttpLoggerMiddleware().use);
  app.use(cookieParser()); // ← important
  
  // Apply JWT guard globally
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  app.useGlobalInterceptors(new ResponseInterceptor());
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
