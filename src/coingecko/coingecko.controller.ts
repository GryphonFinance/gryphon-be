import { Controller, Get, Query } from '@nestjs/common';
import { CoingeckoService } from './coingecko.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('coingecko')
export class CoingeckoController {
  constructor(private readonly coingeckoService: CoingeckoService) {}

  @Get('ohlcv')
  getOhlcv(@Query('pairId') pairId: string, @Query('days') days = '1') {
    return this.coingeckoService.getOhlcvData(pairId, Number(days));
  }

  @Public()
  @Get('gryphon-price')
  getGryphonPrice() {
    return this.coingeckoService.getGryphonPrice();
  }

  @Get('pools')
  getPools(@Query('tokenId') tokenId: string) {
    return this.coingeckoService.getPancakeSwapPool(tokenId);
  }

  @Get('prices')
  getPrices() {
    return this.coingeckoService.getPrices();
  }

  @Get('token-data')
  getTokenData(@Query('token') token: string) {
    return this.coingeckoService.getTokenData(token);
  }
}
