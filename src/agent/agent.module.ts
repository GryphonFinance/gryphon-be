import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentService } from './agent.service';
import { AgentController } from './agent.controller';
import { Agent, AgentSchema } from './schemas/agent.schema';
import { PreBondedAgent, PreBondedAgentSchema } from './schemas/pre-bonded-agent.schema';
import { Stats, StatsSchema } from './schemas/stats.schema';
import { CoingeckoModule } from 'src/coingecko/coingecko.module';
import { Transaction, TransactionSchema } from './schemas/transactions.schema';
import { Graph, GraphSchema } from './schemas/graph.schema';
import { PancakeSwapService } from 'src/blockchain/contracts/pancakeSwap/pancakeSwap.service';
import { FPairService } from 'src/blockchain/contracts/fPair/fPair.service';
import { BondingService } from 'src/blockchain/contracts/bonding/bonding.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Agent.name, schema: AgentSchema },
            { name: PreBondedAgent.name, schema: PreBondedAgentSchema },
            { name: Stats.name, schema: StatsSchema },
            { name: Transaction.name, schema: TransactionSchema },
            { name: Graph.name, schema: GraphSchema },
        ]),
        CoingeckoModule,
    ],
    controllers: [AgentController],
    providers: [AgentService, PancakeSwapService, FPairService, BondingService],
    exports: [AgentService],
})
export class AgentModule {}

