import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';
import { AgentService } from 'src/agent/agent.service';
import { ConfigService } from '@nestjs/config';
import { BondingService } from '../bonding/bonding.service';
@Injectable()
export class Erc20Handler {
  private readonly logger = new Logger(Erc20Handler.name);
  private listeners = new Map<string, ethers.Contract>();
  private bondingContractAddress: string;

  constructor(
    private readonly agentService: AgentService,
    private readonly configService: ConfigService,
    private readonly bondingService: BondingService,
  ) {
    this.bondingContractAddress = this.configService.get<string>('blockchain.contractAddresses.bonding') ?? '';
  }

  async handleTokenTransfer(from: string, to: string, value: bigint, tokenAddress: string, event: any) {
    this.logger.log(`Handling ERC20 Transfer from ${from} to ${to} of ${value.toString()}`);

    // Add Transaction
    const now = new Date();
    const transaction = {
      from: from,
      to: to,
      amount: value.toString(),
      token: tokenAddress,
      transactionHash: event.log.transactionHash,
      blockNumber: event.log.blockNumber,
      timestamp: now.toUTCString(),
    }

    const tx = await this.agentService.addTransaction(transaction);
    if (!tx) return;
    
    // Update PreBondedAgent and Stats
    const tokenInfo = await this.bondingService.getTokenInfo(tokenAddress);
    const preBondedAgent = {
      fName: tokenInfo.stats.fName,
      supply: tokenInfo.stats.totalSupply.toString(),
      price: tokenInfo.stats.priceInGryphon.toString(),
      prevPrice: tokenInfo.stats.prevPriceInGryphon.toString(),
      marketCap: tokenInfo.stats.marketCapInGryphon.toString(),
      liquidity: tokenInfo.stats.liquidityInGryphon.toString(),
      volume: tokenInfo.stats.volumeInGryphon.toString(),
      volume24H: tokenInfo.stats.volume24hInGryphon.toString()
    }
    await this.agentService.updatePreBondedAgent(tokenAddress, preBondedAgent);

    // create ohlcv
    const bondingPair = (await this.agentService.getAgentByToken(tokenAddress))?.bondingPair;
    const currentPrice = (1 / Number(preBondedAgent.price));
    const type = from === bondingPair ? 'buy' : 'sell';
    const volumeInGryphon = (0.99*Number(value) * currentPrice).toString();
    let graph = await this.agentService.getGraphByTime(tokenAddress, (new Date()).toUTCString());
    if (!graph.length) {
      const graphData = {
        open: currentPrice.toString(),
        high: currentPrice.toString(),
        low: currentPrice.toString(),
        close: currentPrice.toString(),
        volume: volumeInGryphon,
        startTimestamp: new Date(now.setSeconds(0,0)).toUTCString(),
        endTimestamp: new Date(now.getTime() + 59999).toUTCString(),
        totalTransactions: 1,
        buyTransactions: type === 'buy' ? 1 : 0,
        sellTransactions: type === 'sell' ? 1 : 0 ,
        buyVolume: type === 'buy' ? volumeInGryphon : '0',
        sellVolume: type === 'sell' ? volumeInGryphon : '0'
      }
      await this.agentService.createGraph(tokenAddress, graphData);
    } else {
        graph[0].open = graph[0].open;
        graph[0].high = Math.max(parseFloat(graph[0].high), currentPrice).toString();
        graph[0].low = Math.min(parseFloat(graph[0].low), currentPrice).toString();
        graph[0].close = currentPrice.toString();
        graph[0].volume = (Number(graph[0].volume) + Number(volumeInGryphon)).toString();
        graph[0].totalTransactions = Number(graph[0].totalTransactions) + 1;
        graph[0].buyTransactions = Number(graph[0].buyTransactions) + (type === 'buy' ? 1 : 0);
        graph[0].sellTransactions = Number(graph[0].sellTransactions) + (type === 'sell' ? 1 : 0);
        graph[0].buyVolume = type === 'buy' ? (Number(graph[0].buyVolume) + Number(volumeInGryphon)).toString() : graph[0].buyVolume;
        graph[0].sellVolume = type === 'sell' ? (Number(graph[0].sellVolume) + Number(volumeInGryphon)).toString() : graph[0].sellVolume;
        await this.agentService.updateGraph(tokenAddress, graph[0]);
    }
  }
}

