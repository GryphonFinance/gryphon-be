import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { getErc20Contract } from './contracts';

@Injectable()
export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private rpcUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {
    this.rpcUrl = this.configService.get<string>('blockchain.rpcUrl') ?? '';
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
  }

  getBlockchainUrl(): string {
    this.logger.log('getBlockchainUrl');
    return this.rpcUrl;
  }

  async getTokenDetails(tokenAddress: string, walletAddress?: string) {
    const contract = getErc20Contract(tokenAddress, this.provider);

    const [name, symbol, decimals, totalSupply, balance] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
      contract.totalSupply(),
      walletAddress ? contract.balanceOf(walletAddress) : Promise.resolve(null),
    ]);

    return {
      name,
      symbol,
      decimals: Number(decimals),
      totalSupply: totalSupply.toString(),
      balance: balance ? balance.toString() : null,
    };
  }
}
