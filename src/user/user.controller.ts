import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  create(@Body('walletAddress') walletAddress: string) {
    return this.userService.createUser(walletAddress);
  }

  @Post(':id/wallet')
  addWallet(
    @Param('id') userId: string,
    @Body('address') address: string,
    @Body('isPrimary') isPrimary: boolean,
  ) {
    return this.userService.addWallet(userId, address, isPrimary);
  }

  @Post(':id/social')
  addSocial(
    @Param('id') userId: string,
    @Body('platform') platform: string,
    @Body('platformUserId') platformUserId: string,
    @Body('username') username: string,
  ) {
    return this.userService.addSocial(userId, platform, platformUserId, username);
  }

  // @UseGuards(JwtAuthGuard)
  @Get('wallet/:address')
  getUserByWallet(@Param('address') address: string) {
    return this.userService.getUserWithWallet(address);
  }
}