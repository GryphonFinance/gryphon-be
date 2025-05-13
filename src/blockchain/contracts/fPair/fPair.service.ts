import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { getFPairContract } from './fPair.contract';

@Injectable()
export class FPairService {
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

    async getReserves(fPairAddress: string) {
        const contract = getFPairContract(fPairAddress, this.provider);
        const reserves = await contract.getReserves();
        return reserves;
    }

    async getAssetBalance(fPairAddress: string) {
        const contract = getFPairContract(fPairAddress, this.provider);
        const assetBalance = await contract.assetBalance();
        return assetBalance;
    }

    async getTokenBalance(fPairAddress: string) {
        const contract = getFPairContract(fPairAddress, this.provider);
        const balance = await contract.balance();
        return balance;
    }
    
}
