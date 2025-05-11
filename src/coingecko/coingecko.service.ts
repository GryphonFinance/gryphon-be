import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PancakeSwapService } from 'src/blockchain/contracts/pancakeSwap/pancakeSwap.service';
@Injectable()
export class CoingeckoService {
  private readonly baseUrl = 'https://pro-api.coingecko.com/api/v3';
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly pancakeSwapService: PancakeSwapService,
  ) {
    this.apiKey = this.configService.get<string>('COINGECKO_API_KEY') || '';
  }

  async getOhlcvData(pairId: string, days = 1): Promise<any> {
    const url = `${this.baseUrl}/coins/${pairId}/market_chart`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, {
        params: { vs_currency: 'usd', days },
        headers: this.apiKey ? { 'x-cg-pro-api-key': this.apiKey } : {},
      }),
    );
    return data;
  }

  async getPancakeSwapPool(tokenId: string): Promise<any> {
    const url = `${this.baseUrl}/coins/${tokenId}`;
    // const url = `${this.baseUrl}/coins/list`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, {
        headers: this.apiKey ? { accept: 'application/json', 'x-cg-pro-api-key': this.apiKey } : {},
      }),
    );
    // return data?.tickers?.filter((t) => t.market.name.includes('PancakeSwap'));
    return data;
  }

  async getPrices(): Promise<any> {
    const url = `${this.baseUrl}/simple/price?vs_currencies=usd&symbols=bnb`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, {
        headers: this.apiKey ? { accept: 'application/json', 'x-cg-pro-api-key': this.apiKey } : {},
      }),
    );
    return { bnb: data.bnb.usd };
  }

  async getGryphonPrice(): Promise<any> {
    const gryphonBusdPool = this.configService.get<string>('blockchain.contractAddresses.gryphonBusdPool') ?? '';
    const poolData = await this.pancakeSwapService.getPoolData(gryphonBusdPool);
    return { gryphonPriceInUsd: poolData.price };
  }

  async getTokenData(token: string): Promise<any> {
    const url = `${this.baseUrl}/coins/${token}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, {
        headers: this.apiKey ? { accept: 'application/json', 'x-cg-pro-api-key': this.apiKey } : {},
      }),
    ) as { data: any };
    return data;
  }
}
