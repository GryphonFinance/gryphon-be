import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { ERC20Service } from './contracts/erc20/erc20.service';
import { BondingService } from './contracts/bonding/bonding.service';
import { Erc20Listener } from './contracts/erc20/erc20.listener';
import { Erc20Handler } from './contracts/erc20/erc20.handler';
import { BondingListener } from './contracts/bonding/bonding.listener';
import { BondingHandler } from './contracts/bonding/bonding.handler';
import { AgentModule } from '../agent/agent.module';
import { FRouterService } from './contracts/fRouter/fRouter.service';
import { PancakeSwapService } from './contracts/pancakeSwap/pancakeSwap.service';

@Module({
  imports: [
    ConfigModule,
    AgentModule,
  ],
  controllers: [BlockchainController],
  providers: [
    BlockchainService,
    ERC20Service,
    Erc20Listener,
    Erc20Handler,
    BondingService,
    BondingListener,
    BondingHandler,
    FRouterService,
    PancakeSwapService,
  ],
  exports: [BlockchainService, BondingService, Erc20Listener, PancakeSwapService],
})
export class BlockchainModule {}
