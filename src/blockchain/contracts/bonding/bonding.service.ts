import { Injectable, Inject, LoggerService, BadRequestException } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { getBondingContract } from './bonding.contract';
import { BlockchainUtils } from '../../utils/blockchain.utils';

@Injectable()
export class BondingService {
    private provider: ethers.JsonRpcProvider;
    private rpcUrl: string;
    private bondingContractAddress: string;

    constructor(
        private readonly configService: ConfigService,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ) {
        this.rpcUrl = this.configService.get<string>('blockchain.rpcUrl') ?? '';
        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
        this.bondingContractAddress = this.configService.get<string>('blockchain.contractAddresses.bonding') ?? '';
    }

    async getDaysInSeconds() {
        const contract = getBondingContract(this.bondingContractAddress, this.provider);
        const daysInSeconds = await contract.DAY_IN_SECONDS();
        return daysInSeconds;
    }

    async getK() {
        const contract = getBondingContract(this.bondingContractAddress, this.provider);
        const k = await contract.K();
        return k;
    }

    async getAgentFactory() {
        const contract = getBondingContract(this.bondingContractAddress, this.provider);
        const agentFactory = await contract.agentFactory();
        return agentFactory;
    }

    async getAssetRate() {
        const contract = getBondingContract(this.bondingContractAddress, this.provider);
        const assetRate = await contract.assetRate();
        return assetRate;
    }

    async getFactory() {
        const contract = getBondingContract(this.bondingContractAddress, this.provider);
        const factory = await contract.factory();
        return factory;
    }

    async getFee() {
        const contract = getBondingContract(this.bondingContractAddress, this.provider);
        const fee = await contract.fee();
        return fee;
    }

    async getUserTokens(account: string) {
        const contract = getBondingContract(this.bondingContractAddress, this.provider);
        const userTokens = await contract.getUserTokens(account);
        return userTokens;
    }

    async getGradThreshold() {
        const contract = getBondingContract(this.bondingContractAddress, this.provider);
        const gradThreshold = await contract.gradThreshold();
        return gradThreshold;
    }

    async getInitialSupply() {
        const contract = getBondingContract(this.bondingContractAddress, this.provider);
        const initialSupply = await contract.initialSupply();
        return initialSupply;
    }

    async getMaxTx() {
        const contract = getBondingContract(this.bondingContractAddress, this.provider);
        const maxTx = await contract.maxTx();
        return maxTx;
    }

    async getOwner() {
        const contract = getBondingContract(this.bondingContractAddress, this.provider);
        const owner = await contract.owner();
        return owner;
    }

    async getProfile(account: string) {
        const contract = getBondingContract(this.bondingContractAddress, this.provider);
        const profile = await contract.profile(account);
        return profile;
    }

    async getRouter() {
        const contract = getBondingContract(this.bondingContractAddress, this.provider);
        const router = await contract.router();
        return router;
    }

    async getTokenInfo(token: string) {
        const isValidAddress = BlockchainUtils.isValidAddress(token);
        if (!isValidAddress) {
            throw new BadRequestException('Invalid token address');
        }

        const contract = getBondingContract(this.bondingContractAddress, this.provider);
        const tokenInfo = await contract.tokenInfo(token);
        const isZeroAddress = BlockchainUtils.isZeroAddress(tokenInfo[1]);
        if (isZeroAddress) {
            throw new BadRequestException('Invalid token address');
        }

        // Convert BigInt values to strings for proper serialization
        const formattedTokenInfo = {
            creator: tokenInfo[0],
            token: tokenInfo[1],
            bondingPair: tokenInfo[2],
            agentToken: tokenInfo[3],
            stats: {
                fName: tokenInfo[4][1],
                name: tokenInfo[4][2],
                ticker: tokenInfo[4][3],
                totalSupply: BlockchainUtils.bigIntToString(tokenInfo[4][4]),
                priceInGryphon: BlockchainUtils.bigIntToString(tokenInfo[4][5]),
                prevPriceInGryphon: BlockchainUtils.bigIntToString(tokenInfo[4][10]),
                marketCapInGryphon: BlockchainUtils.bigIntToString(tokenInfo[4][6]),
                liquidityInGryphon: BlockchainUtils.bigIntToString(tokenInfo[4][7]),
                volumeInGryphon: BlockchainUtils.bigIntToString(tokenInfo[4][8]),
                volume24hInGryphon: BlockchainUtils.bigIntToString(tokenInfo[4][9]),
                lastUpdated: BlockchainUtils.timestampToDate(tokenInfo[4][11])
            },
            description: tokenInfo[5],
            image: tokenInfo[6],
            twitter: tokenInfo[7],
            telegram: tokenInfo[8],
            youtube: tokenInfo[9],
            website: tokenInfo[10],
            trading: tokenInfo[11],
            tradingOnUniswap: tokenInfo[12]
        };

        return formattedTokenInfo;
    }

    async getTokenInfos(id: number) {
        const contract = getBondingContract(this.bondingContractAddress, this.provider);
        const tokenInfos = await contract.tokenInfos(id);
        return tokenInfos;
    }
}