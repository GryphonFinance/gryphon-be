import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { Wallet } from './schemas/wallet.schema';
import { SocialProfile } from './schemas/social-profile.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Wallet.name) private walletModel: Model<Wallet>,
    @InjectModel(SocialProfile.name) private socialModel: Model<SocialProfile>,
  ) { }

  async createUser(defaultWallet?: string) {
    return this.userModel.create({ defaultWallet });
  }

  async addWallet(userId: string, address: string, isPrimary = false) {
    return this.walletModel.create({ userId, address, isPrimary, verifiedAt: new Date() });
  }

  async addSocial(userId: string, platform: string, platformUserId: string, username: string) {
    return this.socialModel.create({ userId, platform, platformUserId, username, verifiedAt: new Date() });
  }

  async getUserWithWallet(address: string) {
    const user = await this.userModel.findOne({ defaultWallet: address }).exec();
    if (user) {
      return user;
    }
    const wallet = await this.walletModel.findOne({ address }).exec();
    if (!wallet) return null;
    return this.userModel.findById(wallet.userId).exec();
  }

  async getUserById(id: string) {
    return this.userModel.findById(id).exec();
  }
}
