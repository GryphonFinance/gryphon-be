import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { Erc20Handler } from './erc20.handler';
import { getErc20Contract } from './erc20.contract';
import { AgentService } from 'src/agent/agent.service';

@Injectable()
export class Erc20Listener implements OnApplicationBootstrap {
    private readonly logger = new Logger(Erc20Listener.name);
    private listeners = new Map<string, ethers.Contract>();
    private provider: ethers.WebSocketProvider;
    private wsUrl: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly handler: Erc20Handler,
        private readonly agentService: AgentService,
    ) {
        this.wsUrl = this.configService.get<string>('blockchain.wsUrl') ?? '';
        this.provider = new ethers.WebSocketProvider(this.wsUrl);
    }

    async onApplicationBootstrap() {
        const agents = await this.agentService.getAllAgents();

        this.provider.on('error', (error) => {
            this.logger.error('WebSocket error:', error);
        });

        for (const agent of agents) {
            await this.listenToToken(agent?.token);
        }
    }

    async listenToToken(tokenAddress: string) {
        if (this.listeners.has(tokenAddress)) {
            this.logger.warn(`Already listening to ${tokenAddress}`);
            return;
        }

        const contract = getErc20Contract(tokenAddress, this.provider);

        contract.on('Transfer', async (from, to, value, event) => {
            // Delegate to handler
            this.logger.log(`Transfer on ${tokenAddress}`);
            await this.handler.handleTokenTransfer(from, to, value, tokenAddress, event);
        });

        this.listeners.set(tokenAddress, contract);
        this.logger.log(`Listening to Transfer events from ${tokenAddress}`);
    }

    // Add other ERC20 events here if needed

}

