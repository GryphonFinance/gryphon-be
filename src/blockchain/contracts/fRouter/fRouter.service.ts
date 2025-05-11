import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { getFRouterContract } from './fRouter.contract';

@Injectable()
export class FRouterService {
    private provider: ethers.JsonRpcProvider;
    private rpcUrl: string;
    private fRouterContractAddress: string;

    constructor(
        private readonly configService: ConfigService,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ) {
        this.rpcUrl = this.configService.get<string>('blockchain.rpcUrl') ?? '';
        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
        this.fRouterContractAddress = this.configService.get<string>('blockchain.contractAddresses.fRouter') ?? '';
    }

    async getAmountsOut(token: string, amountIn: bigint) {
        const contract = getFRouterContract(this.fRouterContractAddress, this.provider);
        const gryphon = this.configService.get<string>('blockchain.contractAddresses.gryphon') ?? '';
        const amountsOut = await contract.getAmountsOut(token, gryphon, amountIn);
        return amountsOut;
    }
}
