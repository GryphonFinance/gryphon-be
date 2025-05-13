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
    const user = await this.userModel.create({ defaultWallet });
    return user.toObject();
  }

  async addWallet(userId: string, address: string, isPrimary = false) {
    return this.walletModel.create({ userId, address, isPrimary, verifiedAt: new Date() });
  }

  async addSocial(userId: string, platform: string, platformUserId: string, username: string) {
    return this.socialModel.create({ userId, platform, platformUserId, username, verifiedAt: new Date() });
  }

  async getUserByWallet(address: string): Promise<User | null> {
    const user = await this.userModel.findOne<User>({ defaultWallet: address }).exec();
    if (!user) return null;
    console.log(user);
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await this.userModel.findById<User>(id).exec();
    if (!user) return null;
    return user;
  }

  async getWalletByUserId(id: string): Promise<Wallet | null> {
    const wallet = await this.walletModel.findOne<Wallet>({ userId: id }).exec();
    if (!wallet) return null;
    return wallet;
  }
}
