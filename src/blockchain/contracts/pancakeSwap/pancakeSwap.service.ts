import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { getPancakeRouterContract } from './pancakeRouter.contract';
import { getPancakePoolContract } from './pancakePool.contract';
import { getPancakeFactoryContract } from './pancakeFactory.contract';

@Injectable()
export class PancakeSwapService {
    private provider: ethers.JsonRpcProvider;
    private rpcUrl: string;
    private pancakeRouterContractAddress: string;
    private pancakeFactoryContractAddress: string;

    constructor(
        private readonly configService: ConfigService,
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ) {
        this.rpcUrl = this.configService.get<string>('blockchain.rpcUrl') ?? '';
        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
        this.pancakeRouterContractAddress = this.configService.get<string>('blockchain.contractAddresses.pancakeRouter') ?? '';
        this.pancakeFactoryContractAddress = this.configService.get<string>('blockchain.contractAddresses.pancakeFactory') ?? '';
    }

    async getAmountsOut(token: string, amountIn: string) {
        const contract = getPancakeRouterContract(this.pancakeRouterContractAddress, this.provider);
        const gryphon = this.configService.get<string>('blockchain.contractAddresses.gryphon') ?? '';
        const amountsOut = await contract.getAmountsOut(amountIn, [gryphon, token]);
        return amountsOut;
    }

    async getPoolData(poolAddress: string) {
        const contract = getPancakePoolContract(poolAddress, this.provider);
        const reserves = await contract.getReserves();
        const token0 = await contract.token0();
        const token1 = await contract.token1();
        const price = Number(reserves[1]) / Number(reserves[0]);
        return {
            token0: token0.toString(),
            token1: token1.toString(),
            reserve0: reserves[0].toString(),
            reserve1: reserves[1].toString(),
            price: price.toString(),
        };
    }

    async getTokenPair(token: string) {
        const contract = getPancakeFactoryContract(this.pancakeFactoryContractAddress, this.provider);
        const pair = await contract.getPair(token, this.configService.get<string>('blockchain.contractAddresses.gryphon'));
        return pair;
    }

    async getTokenOHLCV(token: string, granularity: string, startTime: number, endTime: number, gryphonPriceInUsd: number) {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer ory_at_EyoeEsTlhnHtBSS7bfXZVH801wdY_xd0WYK7oc_BDcs.qoyJKm2Pn4833LjF7iBe3S2KhVjt2OCj8bQ6BXNzVEk");
        myHeaders.append("X-API-KEY", "BQYFaGbCyQhYeCkvzbuMANYvAuHLCLGY");

        const baseTokenAddress = token;
        const quoteTokenAddress = this.configService.get<string>('blockchain.contractAddresses.gryphon');
        // const baseTokenAddress = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82";
        // const quoteTokenAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
        const timeIntervalMinutes = granularity;
        const startDate = new Date(startTime * 1000).toISOString();
        const endDate = new Date(endTime * 1000).toISOString();
        const network = this.configService.get<string>('blockchain.network');

        const raw = JSON.stringify({
            "query": "query GetPancakeSwapCandlestickData($baseTokenAddress: String!, $quoteTokenAddress: String!, $timeIntervalMinutes: Int!, $startDate: ISO8601DateTime!, $endDate: ISO8601DateTime!, $network: EthereumNetwork) {\n  ethereum(network: $network) {\n    dexTrades(\n      options: {desc: \"timeInterval.minute\"}\n      date: {before: $endDate, after: $startDate}\n      baseCurrency: {is: $baseTokenAddress}\n      quoteCurrency: {is: $quoteTokenAddress}\n      ) {\n      timeInterval {\n        minute(count: $timeIntervalMinutes, format: \"%Y-%m-%dT%H:%M:%SZ\")\n      }\n      volume: quoteAmount\n      high: quotePrice(calculate: maximum)\n      low: quotePrice(calculate: minimum)\n      open: minimum(of: block, get: quote_price)\n      close: maximum(of: block, get: quote_price)\n    }\n  }\n}\n",
            "variables": `{\n  "baseTokenAddress": "${baseTokenAddress}",\n  "quoteTokenAddress": "${quoteTokenAddress}", \n  "timeIntervalMinutes": ${timeIntervalMinutes}, \n  "startDate": "${startDate}",\n  "endDate": "${endDate}",\n  "network": "${network}"\n}`
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow" as RequestRedirect
        };

        console.log('requestOptions', requestOptions)

        const response = await fetch("https://graphql.bitquery.io", requestOptions);
        const data = await response.json();

        if (!data.data?.ethereum?.dexTrades) {
            this.logger.error('Invalid response structure:', data);
            return [];
        }

        const transformedData = await Promise.all(data.data.ethereum.dexTrades.map(async (trade) => {
            const startTime = new Date(trade.timeInterval.minute);
            const endTime = new Date(startTime.getTime() + 60 * 1000); // +1 minute

            return {
                startTimestamp: startTime.toISOString(),
                endTimestamp: endTime.toISOString(),
                open: Number(trade.open) * Number(gryphonPriceInUsd),
                high: Number(trade.high) * Number(gryphonPriceInUsd),
                low: Number(trade.low) * Number(gryphonPriceInUsd),
                close: Number(trade.close) * Number(gryphonPriceInUsd),
                volume: Number(trade.volume) * Number(gryphonPriceInUsd),
                openPrice: Number(trade.open) * Number(gryphonPriceInUsd),
                highestPrice: Number(trade.high) * Number(gryphonPriceInUsd),
                lowestPrice: Number(trade.low) * Number(gryphonPriceInUsd),
                closePrice: Number(trade.close) * Number(gryphonPriceInUsd),
                tradingVolume: Number(trade.volume) * Number(gryphonPriceInUsd)
            };
        }));
        return transformedData;
    }

    async getStats(poolAddress: string, gryphonPriceInUsd: number) {
        const poolData = await this.getPoolData(poolAddress);
        console.log('poolData', poolData)
        const agentTokenPriceInUsd = Number(poolData.price) * gryphonPriceInUsd;
        const marketCapInUsd = Number(1000000000) * agentTokenPriceInUsd;
        const liquidityInUsd = 2 * Number(ethers.formatEther(poolData.reserve1)) * gryphonPriceInUsd;
        const volume = await this.getVolume(poolData.token1, poolData.token0, gryphonPriceInUsd);
        const priceChange = await this.getPriceChange(poolData.token1, poolData.token0, gryphonPriceInUsd);

        return {
            priceInUsd: agentTokenPriceInUsd,
            marketCapInUsd,
            liquidityInUsd,
            volume1H: volume.volume1H,
            volume24H: volume.volume24H,
            volume7D: volume.volume7D,
            priceChange24H: priceChange ? priceChange.percentageChange24H : 0,
            // volume1H: 0,
            // volume24H: 0,
            // volume7D: 0,
            // priceChange24H: 0
        }
    }

    async getVolume(quoteTokenAddress: string, baseTokenAddress: string, gryphonPriceInUsd: number) {

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer ory_at_EyoeEsTlhnHtBSS7bfXZVH801wdY_xd0WYK7oc_BDcs.qoyJKm2Pn4833LjF7iBe3S2KhVjt2OCj8bQ6BXNzVEk");
        myHeaders.append("X-API-KEY", "BQYFaGbCyQhYeCkvzbuMANYvAuHLCLGY");

        const fetchVolumeForDuration = async (durationHours: number, timeLabel: string) => {
            const now = new Date();
            const endTimeUTC = now.toISOString();
            const startTimeUTC = new Date(now.getTime() - durationHours * 60 * 60 * 1000).toISOString();
            console.log('startTimeUTC', startTimeUTC)
            console.log('endTimeUTC', endTimeUTC)
            // const baseTokenAddress = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82";
            // const quoteTokenAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
            const network = this.configService.get<string>('blockchain.network');


            const query = `
                query GetVolumeForDuration(
                    $baseTokenAddress: String!
                    $quoteTokenAddress: String!
                    $endTimeUTC: ISO8601DateTime!
                    $startTimeUTC: ISO8601DateTime!
                    $network: EthereumNetwork
                ) {
                    ethereum(network: $network) {
                    dexTrades(
                    date: {after: $startTimeUTC, before: $endTimeUTC}
                    baseCurrency: {is: $baseTokenAddress}
                    quoteCurrency: {is: $quoteTokenAddress}
                    ) {
                    volume: quoteAmount
                    }
                    }
                }
            `;

            const variables = {
                baseTokenAddress: baseTokenAddress,
                quoteTokenAddress: quoteTokenAddress,
                endTimeUTC: endTimeUTC,
                startTimeUTC: startTimeUTC,
                network: network
            };

            const raw = JSON.stringify({
                query: query,
                variables: variables,
            });

            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: raw,
                redirect: "follow" as RequestRedirect,
            };

            try {
                const response = await fetch("https://graphql.bitquery.io", requestOptions);
                const data = await response.json();

                if (data.data?.ethereum?.dexTrades) {
                    const totalVolume = data.data.ethereum.dexTrades.reduce((sum, trade) => sum + (trade.volume || 0), 0);
                    console.log(`${timeLabel} Volume:`, totalVolume); // Debugging
                    return totalVolume;
                } else {
                    console.warn(`No trades data for ${timeLabel}`, data); // warning for empty data
                    return 0; // Return 0 to avoid errors in aggregation
                }
            } catch (error) {
                console.error(`Error fetching ${timeLabel} volume:`, error);
                return 0; // Return 0 in case of error
            }
        };

        try {
            const volume1H = await fetchVolumeForDuration(1, "1H");
            const volume24H = await fetchVolumeForDuration(24, "24H");
            const volume7D = await fetchVolumeForDuration(24 * 7, "7D");

            return {
                volume1H: Number(volume1H) * Number(gryphonPriceInUsd),
                volume24H: Number(volume24H) * Number(gryphonPriceInUsd),
                volume7D: Number(volume7D) * Number(gryphonPriceInUsd),
            };
        } catch (error) {
            console.error("Error in getVolume", error);
            return {  //important, the function should always return a value.
                volume1H: 0,
                volume24H: 0,
                volume7D: 0
            }
        }
    }

    async getPriceChange(quoteTokenAddress: string, baseTokenAddress: string, gryphonPriceInUsd: number) {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Authorization", "Bearer ory_at_NaCQE7anktzNmsfJEpJ9xcaqK9JtFNb15Y3VQdtFw9o.ahikiVa8R7fyvkyZ7I5pFu1ahkgo7UnYhjd7RT2mqQE");
        myHeaders.append("X-API-KEY", "BQYFaGbCyQhYeCkvzbuMANYvAuHLCLGY");
    
        const fetchPriceChange = async (date: string) => {
            const network = this.configService.get<string>('blockchain.network');
            const baseCurrency = baseTokenAddress;
            const quoteCurrency = quoteTokenAddress;
            // const baseCurrency = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82";
            // const quoteCurrency = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

            const query = `
            query GetPriceChange(
                $baseTokenAddress: String!
                $quoteTokenAddress: String!
                $date: ISO8601DateTime!
                $network: EthereumNetwork
            ) {
                ethereum(network: $network) {
                    dexTrades(
                        baseCurrency: { is: $baseTokenAddress }
                        quoteCurrency: { is: $quoteTokenAddress }
                        options: { limit: 1, desc: "timeInterval.minute" }
                        date: { before: $date }
                    ) {
                        timeInterval {
                            minute
                        }
                        baseCurrency {
                            symbol
                        }
                        quoteCurrency {
                            symbol
                        }
                        quotePrice
                    }
                }
            }`;
        
            const variables = {
                baseTokenAddress: baseCurrency,
                quoteTokenAddress: quoteCurrency,
                date: new Date(date).toISOString(),
                network: network
            }
        
            const raw = JSON.stringify({
                query: query,
                variables: variables
            });
        
            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: raw,
                redirect: "follow" as RequestRedirect
            };
        
            try {
                const response = await fetch("https://graphql.bitquery.io", requestOptions);
                const result = await response.json();
        
                // Extract the price
                if (result.data.ethereum.dexTrades.length > 0) {
                    const price = parseFloat(result.data.ethereum.dexTrades[0].quotePrice);
                    return price;
                } else {
                    return 0;
                }
            } catch (error) {
                console.error("Error fetching price change:", error);
                return null;
            }
        };

        try {
            const latestPrice = await fetchPriceChange((new Date()).toISOString());
            const prevPrice24H = await fetchPriceChange(new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString());

            const priceChange = Number(latestPrice) - Number(prevPrice24H);
            const percentageChange = ((priceChange / Number(prevPrice24H)) * 100).toFixed(2);
            
            return {
                latestPrice: Number(latestPrice),
                prevPrice24H: Number(prevPrice24H),
                priceChange24H: Number(priceChange),
                percentageChange24H: Number(percentageChange)
            }
        } catch (error) {
            console.error("Error in getPriceChange", error);
            return {  //important, the function should always return a value.
                latestPrice: 0,
                prevPrice24H: 0,
                priceChange24H: 0,
                percentageChange24H: 0
            }
        }
    }
}
