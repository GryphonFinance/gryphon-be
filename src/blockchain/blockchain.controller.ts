import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { ERC20Service } from './contracts/erc20/erc20.service';
import { BondingService } from './contracts/bonding/bonding.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { PancakeSwapService } from './contracts/pancakeSwap/pancakeSwap.service';
@Controller('blockchain')
export class BlockchainController {
  constructor(
    private readonly blockchainService: BlockchainService,
    private readonly erc20Service: ERC20Service,
    private readonly bondingService: BondingService,
    private readonly pancakeSwapService: PancakeSwapService,
  ) { }

  @Get('token-info/:address')
  getTokenInfo(@Param('address') address: string) {
    return this.bondingService.getTokenInfo(address);
  }

  @Public()
  @Get('get-amounts-out')
  getAmountsOut(@Query('token') token: string, @Query('amount') amount: string) {
    return this.pancakeSwapService.getAmountsOut(token, amount);
  }
}
