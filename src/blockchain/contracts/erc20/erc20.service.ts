import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { getErc20Contract } from './erc20.contract';

@Injectable()
export class ERC20Service {
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

    
}
