import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './logger/logger.module';
import { ConfigModule } from './config/config.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { UserModule } from './user/user.module';
import { CoingeckoModule } from './coingecko/coingecko.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AgentModule } from './agent/agent.module';
import { S3Module } from './s3/s3.module';

@Module({
  imports: [
    LoggerModule,
    ConfigModule,
    BlockchainModule,
    UserModule,
    CoingeckoModule,
    DatabaseModule,
    AuthModule,
    AgentModule,
    S3Module,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
