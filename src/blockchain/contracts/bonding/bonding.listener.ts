import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { BondingHandler } from './bonding.handler';
import { getBondingContract } from './bonding.contract';

@Injectable()
export class BondingListener implements OnApplicationBootstrap {
    private readonly logger = new Logger(BondingListener.name);
    
    constructor(
        private readonly configService: ConfigService,
        private readonly handler: BondingHandler,
    ) {}

    async onApplicationBootstrap() {
        try {
            const wsUrl = this.configService.get<string>('blockchain.wsUrl') ?? '';
            const provider = new ethers.WebSocketProvider(wsUrl);

            provider.on('error', (error) => {
                this.logger.error('WebSocket error:', error);
            });

            const contractAddress = this.configService.get<string>('blockchain.contractAddresses.bonding');
            if (!contractAddress) {
                this.logger.error('Bonding contract address not configured');
                return;
            }

            const contract = getBondingContract(contractAddress, provider);

            contract.on('Launched', (token: string, pair: string, index: bigint) => {
                this.handler.handleLaunched(token, pair, index);
            });

            contract.on('Graduated', (token: string, agentToken: string) => {
                this.handler.handleGraduated(token, agentToken);
            });

            this.logger.log('[Bonding Listener] Launched event listener attached');
            this.logger.log('[Bonding Listener] Graduated event listener attached');
        } catch (error) {
            this.logger.error('Failed to attach Bonding listener:', error);
        }
    }
}

