import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { BondingHandler } from './bonding.handler';
import { getBondingContract } from './bonding.contract';

@Injectable()
export class BondingListener implements OnApplicationBootstrap {
    private readonly logger = new Logger(BondingListener.name);
    private provider: ethers.WebSocketProvider | null = null;
    private contract: ethers.Contract | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // Start with 1 second delay
    
    constructor(
        private readonly configService: ConfigService,
        private readonly handler: BondingHandler,
    ) {}

    private async setupWebSocket() {
        try {
            const wsUrl = this.configService.get<string>('blockchain.wsUrl');
            if (!wsUrl) {
                this.logger.error('WebSocket URL not configured');
                return;
            }

            this.provider = new ethers.WebSocketProvider(wsUrl);

            // Get the underlying WebSocket instance
            const ws = (this.provider as any).websocket;

            ws.on('error', (error: Error) => {
                this.logger.error('WebSocket error:', error);
                this.handleReconnect();
            });

            ws.on('close', () => {
                this.logger.warn('WebSocket connection closed');
                this.handleReconnect();
            });

            const contractAddress = this.configService.get<string>('blockchain.contractAddresses.bonding');
            if (!contractAddress) {
                this.logger.error('Bonding contract address not configured');
                return;
            }

            this.contract = getBondingContract(contractAddress, this.provider);

            this.contract.on('Launched', (token: string, pair: string, index: bigint) => {
                this.handler.handleLaunched(token, pair, index);
            });

            this.contract.on('Graduated', (token: string, agentToken: string) => {
                this.handler.handleGraduated(token, agentToken);
            });

            this.logger.log('[Bonding Listener] Launched event listener attached');
            this.logger.log('[Bonding Listener] Graduated event listener attached');
            
            // Reset reconnect attempts on successful connection
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
        } catch (error) {
            this.logger.error('Failed to setup WebSocket:', error);
            this.handleReconnect();
        }
    }

    private async handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.logger.error('Max reconnection attempts reached. Please check your connection and restart the application.');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // Max 30 seconds delay
        
        this.logger.log(`Attempting to reconnect in ${delay/1000} seconds... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        // Cleanup existing connection
        if (this.contract) {
            this.contract.removeAllListeners();
            this.contract = null;
        }
        if (this.provider) {
            const ws = (this.provider as any).websocket;
            if (ws) {
                ws.removeAllListeners();
            }
            this.provider = null;
        }

        // Wait for the delay and then reconnect
        setTimeout(() => {
            this.setupWebSocket();
        }, delay);
    }

    async onApplicationBootstrap() {
        await this.setupWebSocket();
    }
}

