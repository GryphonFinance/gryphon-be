import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './schemas/user.schema';
import { Wallet } from './schemas/wallet.schema';
import { Document, Types } from 'mongoose';

// type UserDocument = User & Document & {
//   _id: Types.ObjectId;
// };

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

  @Get('wallet/:address')
  async getUserByWallet(@Param('address') address: string) {
    const user = await this.userService.getUserByWallet(address) as User;
    if (!user) return null;
    const wallet = await this.userService.getWalletByUserId(user._id.toString()) as Wallet;
    return {
      ...user.toObject(),
      wallet,
    };
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.getUserById(id) as User;
    if (!user) return null;
    const wallet = await this.userService.getWalletByUserId(user._id.toString()) as Wallet;
    return {
      ...user.toObject(),
      wallet,
    };
  }
}