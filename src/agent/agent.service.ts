import { Injectable, Logger, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Agent } from './schemas/agent.schema';
import { PreBondedAgent } from './schemas/pre-bonded-agent.schema';
import { CoingeckoService } from 'src/coingecko/coingecko.service';
import { ethers } from 'ethers';
import { Stats } from './schemas/stats.schema';
import { Transaction } from './schemas/transactions.schema';
import { Graph } from './schemas/graph.schema';
import { PancakeSwapService } from 'src/blockchain/contracts/pancakeSwap/pancakeSwap.service';
import { FPairService } from 'src/blockchain/contracts/fPair/fPair.service';
import { BondingService } from 'src/blockchain/contracts/bonding/bonding.service';

@Injectable()
export class AgentService {
    private readonly logger = new Logger(AgentService.name);

    constructor(
        @InjectModel(Agent.name) private agentModel: Model<Agent>,
        @InjectModel(PreBondedAgent.name) private preBondedAgentModel: Model<PreBondedAgent>,
        @InjectModel(Stats.name) private statsModel: Model<Stats>,
        @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
        @InjectModel(Graph.name) private graphModel: Model<Graph>,
        private readonly coingeckoService: CoingeckoService,
        private readonly pancakeSwapService: PancakeSwapService,
        private readonly fPairService: FPairService,
        private readonly bondingService: BondingService
    ) { }

    async createAgent(agentData: any) {
        // Check if agent already exists
        const existingAgent = await this.agentModel.findOne({ token: agentData.agent.token });
        if (existingAgent) {
            throw new ConflictException(`Agent with token ${agentData.agent.token} already exists`);
        }

        const createdAgent = await this.agentModel.create(agentData.agent);
        this.logger.log(`Created agent with ID: ${createdAgent._id}`);

        agentData.preBondedAgent.agent = createdAgent._id;
        const createdPreBondedAgent = await this.preBondedAgentModel.create(agentData.preBondedAgent);
        this.logger.log(`Created preBondedAgent with ID: ${createdPreBondedAgent._id}`);
        await createdPreBondedAgent.save();

        const stats = await this.calculateStats(createdPreBondedAgent);
        const createdStats = await this.statsModel.create({ preBondedAgent: createdPreBondedAgent._id, ...stats });
        this.logger.log(`Created stats with ID: ${createdStats._id}`);


        const now = new Date();
        const graphData = {
            open: (1 / Number(createdPreBondedAgent.price)).toString(),
            high: (1 / Number(createdPreBondedAgent.price)).toString(),
            low: (1 / Number(createdPreBondedAgent.price)).toString(),
            close: (1 / Number(createdPreBondedAgent.price)).toString(),
            volume: '0',
            startTimestamp: new Date(now.setSeconds(0,0)).toUTCString(),
            endTimestamp: new Date(now.getTime() + 59999).toUTCString(),
            totalTransactions: 1,
            buyTransactions: 1,
            sellTransactions: 0,
            buyVolume: '0',
            sellVolume: '0',
            buyers: 1,
            sellers: 0
        }
        const createdGraph = await this.graphModel.create({ agent: createdAgent._id, ...graphData });
        this.logger.log(`Created graph with ID: ${createdGraph._id}`);
        
        return { agentId: createdAgent._id };
    }

    async createGraph(tokenAddress: string, graphData: any) {
        const agent = await this.agentModel.findOne({ token: tokenAddress });
        if (!agent) {
            throw new NotFoundException(`Agent with token ${tokenAddress} not found`);
        }
        const createdGraph = await this.graphModel.create({ agent: agent._id, ...graphData });   
        this.logger.log(`Created graph with ID: ${createdGraph._id}`);
        return createdGraph;
    }

    async getGraphByTime(tokenAddress: string, time: string) {
        const agent = await this.agentModel.findOne({ token: tokenAddress });
        if (!agent) {
            throw new NotFoundException(`Agent with token ${tokenAddress} not found`);
        }
        const graph = await this.graphModel.find({ agent: agent._id, startTimestamp: { $lte: time }, endTimestamp: { $gte: time } });
        return graph;
    }

    async getAgent(id: string) {
        const agent = await this.agentModel.findById(id);
        if (!agent) {
            throw new NotFoundException(`Agent with ID ${id} not found`);
        }
        const gryphonPriceInUsd = (await this.coingeckoService.getGryphonPrice()).gryphonPriceInUsd;
        // this.logger.log(`Found agent: ${JSON.stringify(agent)}`);

        if (agent.isGraduated) {
            // fetch data from coingecko and respond back
            const stats = (await this.pancakeSwapService.getStats(agent.lpPair, gryphonPriceInUsd)) as any;
            return {
                agent: agent ? { ...agent.toObject(), erc20Address: agent.token, stats } : null
            }            
        }

        const preBondedAgent = await this.preBondedAgentModel.findOne({ agent: new Types.ObjectId(id) });
        // this.logger.log(`Found preBondedAgent: ${JSON.stringify(preBondedAgent)}`);
        
        const stats = await this.statsModel.findOne({ preBondedAgent: preBondedAgent?._id });
        return {
            ...agent.toObject(), erc20Address: agent.token, preBondedAgent: preBondedAgent ? preBondedAgent.toObject() : null, stats
        };
    }

    async getAllAgents() {
        const agents = await this.agentModel.find();
        const gryphonPriceInUsd = (await this.coingeckoService.getGryphonPrice()).gryphonPriceInUsd;
        const agentsWithPreBondedAgent = await Promise.all(
            agents.map(async (agent) => {
                const preBondedAgent = await this.preBondedAgentModel.findOne({ agent: agent._id });
                let stats = null;
                if (!agent.isGraduated) {   
                    stats = await this.statsModel.findOne({ preBondedAgent: preBondedAgent?._id });
                } else {
                    // fetch from the graph
                    stats = (await this.pancakeSwapService.getStats(agent.lpPair, gryphonPriceInUsd)) as any;
                }
                return {
                    ...agent.toObject(),
                    preBondedAgent: preBondedAgent ? preBondedAgent.toObject() : null,
                    stats
                };
            })
        );
        return agentsWithPreBondedAgent;
    }

    async getAllAgentsTokens(): Promise<string[]> {
        const agents = await this.agentModel.find({}, { token: 1, _id: 0 });
        return agents.map(agent => agent.token);
    }

    async getAgentByToken(token: string) {
        const agent = await this.agentModel.findOne({ token: token });
        return agent;
    }

    async updateAgent(token: string, agent: any) {
        this.logger.log(`Updating agent with token: ${token}`);
        this.logger.log(`Update data: ${JSON.stringify(agent)}`);
        
        const agentToUpdate = await this.getAgentByToken(token);
        if (!agentToUpdate) {
            throw new NotFoundException(`Agent with token ${token} not found`);
        }
        
        // this.logger.log(`Found agent to update: ${JSON.stringify(agentToUpdate)}`);
        
        const agentUpdated = await this.agentModel.findOneAndUpdate(
            { _id: agentToUpdate._id }, 
            { $set: agent }, 
            { new: true, runValidators: true }
        );
        
        this.logger.log(`Updated agent result: ${JSON.stringify(agentUpdated)}`);
        return agentUpdated;
    }

    async updatePreBondedAgent(token: string, preBondedAgent: any) {
        const agent = await this.getAgentByToken(token);
        if (!agent) {
            throw new NotFoundException(`Agent with token ${token} not found`);
        }

        const preBondedAgentUpdated = await this.preBondedAgentModel.findOneAndUpdate({ agent: agent._id }, { $set: preBondedAgent }, { new: true });
        this.logger.log(`Updated preBondedAgent with ID: ${preBondedAgentUpdated?._id}`);

        const stats = await this.calculateStats(preBondedAgentUpdated);
        const statsUpdated = await this.statsModel.findOneAndUpdate({ preBondedAgent: preBondedAgentUpdated?._id }, { $set: stats }, { new: true });
        this.logger.log(`Updated stats with ID: ${statsUpdated?._id}`);

        return {
            agentId: agent._id,
            preBondedAgentId: preBondedAgentUpdated?._id,
            statsId: statsUpdated?._id
        }
    }

    async addTransaction(transaction: any) {
        const agent = await this.getAgentByToken(transaction.token);
        if (!agent) {
            throw new NotFoundException(`Agent with ID ${transaction.token} not found`);
        }
        let type = ''
        if (transaction.from === agent.bondingPair) type = 'buy'
        else if (transaction.to === agent.bondingPair) type = 'sell'
        else return null;

        const createdTransaction = await this.transactionModel.create(
            { ...transaction, agent: agent._id, type: type }
        );
        this.logger.log(`Created transaction with ID: ${createdTransaction._id}`);
        return createdTransaction;
    }

    async updateGraph(tokenAddress: string, graph: any) {
        const agent = await this.getAgentByToken(tokenAddress);
        if (!agent) {
            throw new NotFoundException(`Agent with token ${tokenAddress} not found`);
        }
        const updatedGraph = await this.graphModel.findOneAndUpdate({ agent: agent._id, startTimestamp: graph.startTimestamp }, { $set: graph }, { new: true });
        this.logger.log(`Updated graph with ID: ${updatedGraph?._id}`);
        return updatedGraph;
    }

    async calculateStats(preBondedAgent: any): Promise<any> {
        if (!preBondedAgent) {
            return {
                priceInUsd: '0',
                marketCapInUsd: '0',
                liquidityInUsd: '0',
                volume1H: '0',
                volume24H: '0',
                volume7D: '0',
                tokensSoldInUsd: '0',
                graduationPercentage: '0',
                graduationThresholdInUsd: '0',
                priceChange24H: '0'
            };
        }

        const gryphonPriceInUsd = (await this.coingeckoService.getGryphonPrice()).gryphonPriceInUsd;
        const priceInUsd = (1 / Number(preBondedAgent.price)) * Number(gryphonPriceInUsd);
        const marketCapInUsd = Number(ethers.formatEther(preBondedAgent.marketCap)) * Number(gryphonPriceInUsd);
        const liquidityInUsd = Number(ethers.formatEther(preBondedAgent.liquidity)) * Number(gryphonPriceInUsd);
        
        // Calculate volume for 1 hour, 24 hours, and 7 days
        const txn1H = await this.transactionModel.find({
            agent: preBondedAgent.agent, 
            timestamp: { $gte: new Date(Date.now() - 1 * 60 * 60 * 1000) } 
        }).exec();
        const volume1HInWei = txn1H.reduce((sum, doc) => sum + (Number(doc.amount) || 0), 0);
        const volume1HInUsd = Number(ethers.formatEther(volume1HInWei)) * Number(priceInUsd);

        const txn24H = await this.transactionModel.find({
            agent: preBondedAgent.agent, 
            timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
        }).exec();
        const volume24HInWei = txn24H.reduce((sum, doc) => sum + (Number(doc.amount) || 0), 0);
        const volume24HInUsd = Number(ethers.formatEther(volume24HInWei)) * Number(priceInUsd);
        
        const txn7D = await this.transactionModel.find({
            agent: preBondedAgent.agent, 
            timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
        }).exec();
        const volume7DInWei = txn7D.reduce((sum, doc) => sum + (Number(doc.amount) || 0), 0);
        const volume7DInUsd = Number(ethers.formatEther(volume7DInWei)) * Number(priceInUsd);
        
        // Calculate graduation percentage
        const fPairAddress = preBondedAgent.bondingPair;
        const tokenBalance = await this.fPairService.getTokenBalance(fPairAddress);
        const tokenBalanceInUsd = Number(ethers.formatEther(tokenBalance)) * Number(priceInUsd);
        const tokensSold = Number(preBondedAgent.supply) - Number(tokenBalance);
        const tokensSoldInUsd = Number(ethers.formatEther(tokensSold)) * Number(priceInUsd);
        const graduationThreshold = await this.bondingService.getGradThreshold();
        const graduationPercentage = tokensSold / ( Number(preBondedAgent.supply) - Number(graduationThreshold) );
        const graduationThresholdInUsd = Number(ethers.formatEther(Number(preBondedAgent.supply) - Number(graduationThreshold))) * Number(priceInUsd);

        // Calculate price change for 24 hours
        let priceChange24H = 0;
        const priceBefore24H = await this.graphModel.findOne({ agent: preBondedAgent.agent, startTimestamp: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
        if (!priceBefore24H) {
            priceChange24H = 0;
        } else {
            priceChange24H = (Number(priceInUsd) - Number(priceBefore24H?.close)) / Number(priceBefore24H?.close);
        }

        const stats = {
            priceInUsd: priceInUsd.toString(),
            marketCapInUsd: marketCapInUsd.toString(),
            liquidityInUsd: liquidityInUsd.toString(),
            volume1H: volume1HInUsd.toString(),
            volume24H: volume24HInUsd.toString(),
            volume7D: volume7DInUsd.toString(),
            tokensSoldInUsd: tokensSoldInUsd.toString(),
            graduationPercentage: graduationPercentage.toString(),
            graduationThresholdInUsd: graduationThresholdInUsd.toString(),
            priceChange24H: priceChange24H.toString()
        }

        return stats;        
    }

    async getGraph(id: string, granularity: string, startTime: number, endTime: number) {
        const gryphonPrice = await this.coingeckoService.getGryphonPrice();
        const agent = await this.agentModel.findById(id);
        if (!agent) {
            throw new NotFoundException(`Agent with ID ${id} not found`);
        }
        if (!agent.isGraduated) {
            let graph = await this.graphModel.find({ agent: agent._id });
            const returnData: any[] = [];
            const seenTimestamps = new Set<number>();
    
            for (let i = 0; i < graph.length; i++) {
                const startTime = new Date(graph[i].startTimestamp).getTime();
                const endTime = new Date(graph[i].endTimestamp).getTime();
                
                // Skip if we've already seen this timestamp
                if (seenTimestamps.has(startTime)) {
                    continue;
                }
                seenTimestamps.add(startTime);
    
                returnData.push({ 
                    ...graph[i].toObject(),
                    openPrice: Number(graph[i].open) * Number(gryphonPrice.gryphonPriceInUsd),
                    highestPrice: Number(graph[i].high) * Number(gryphonPrice.gryphonPriceInUsd),
                    lowestPrice: Number(graph[i].low) * Number(gryphonPrice.gryphonPriceInUsd),
                    closePrice: Number(graph[i].close) * Number(gryphonPrice.gryphonPriceInUsd),
                    tradingVolume: Number(graph[i].volume) * Number(gryphonPrice.gryphonPriceInUsd),
                    startTimeMilliseconds: startTime,
                    endTimeMilliseconds: endTime,
                    granularity: granularity,
                    tokenAddress: agent.token
                });
            }
            // Sort the data in ascending order based on startTimeMilliseconds
            return returnData.sort((a, b) => a.startTimeMilliseconds - b.startTimeMilliseconds);
        }
        const ohlcv = await this.pancakeSwapService.getTokenOHLCV(agent.agentToken, granularity, startTime, endTime, gryphonPrice.gryphonPriceInUsd);
        return ohlcv;
    }
}

