import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CoingeckoService } from './coingecko.service';
import { CoingeckoController } from './coingecko.controller';
import { ConfigModule } from '@nestjs/config';
import { PancakeSwapService } from 'src/blockchain/contracts/pancakeSwap/pancakeSwap.service';
@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [CoingeckoController],
  providers: [CoingeckoService, PancakeSwapService],
  exports: [CoingeckoService],
})
export class CoingeckoModule {}
