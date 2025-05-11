import { Injectable, Logger } from '@nestjs/common';
import { AgentService } from 'src/agent/agent.service';
import { Erc20Listener } from '../erc20/erc20.listener';
import { BondingService } from './bonding.service';
import { PancakeSwapService } from '../pancakeSwap/pancakeSwap.service';
@Injectable()
export class BondingHandler {
    private readonly logger = new Logger(BondingHandler.name);

    constructor(
        private readonly agentService: AgentService,
        private readonly erc20Listener: Erc20Listener,
        private readonly bondingService: BondingService,
        private readonly pancakeSwapService: PancakeSwapService,
    ) {}

    async handleLaunched(token: string, pair: string, index: bigint) {
        this.logger.log(`Handling Bonding Launched event for token: ${token}, pair: ${pair}, index: ${index}`);
        const tokenInfo = await this.bondingService.getTokenInfo(token);
        const agent = {
            index: index.toString(),
            creator: tokenInfo.creator,
            token: token,
            bondingPair: tokenInfo.bondingPair,
            agentToken: tokenInfo.agentToken,
            name: tokenInfo.stats.name,
            ticker: tokenInfo.stats.ticker,
            description: tokenInfo.description,
            image: tokenInfo.image,
            twitter: tokenInfo.twitter,
            telegram: tokenInfo.telegram,
            youtube: tokenInfo.youtube,
            website: tokenInfo.website,
            trading: tokenInfo.trading,
            tradingOnUniswap: tokenInfo.tradingOnUniswap
        }
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
        const agentId = await this.agentService.createAgent({agent, preBondedAgent});
        await this.erc20Listener.listenToToken(token); // TODO: Test this
        this.logger.log(`Agent created with ID: ${agentId.agentId}`);
    }

    async handleGraduated(token: string, agentToken: string) {
        this.logger.log(`Handling Bonding Graduated event for token: ${token}, agentToken: ${agentToken}`);
        const lpPair = await this.pancakeSwapService.getTokenPair(agentToken);
        const updatedAgent = await this.agentService.updateAgent(token, { isGraduated: true, agentToken: agentToken, trading: false, tradingOnUniswap: true, lpPair: lpPair });
        this.logger.log(`Agent updated: ${JSON.stringify(updatedAgent)}`);
    }
}

