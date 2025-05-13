import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WalletLoginDto } from './dto/wallet-login.dto';
import { UserService } from '../user/user.service';
import { verifySignature } from './utils/signature.utils';
import { ConfigService } from '@nestjs/config';
import { User } from '../user/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async loginWithWallet(dto: WalletLoginDto): Promise<{ token: string, userId: string }> {
    const user = await this.userService.getUserByWallet(dto.address);
    if (!user) throw new UnauthorizedException('User not found');

    const message = `${this.configService.get<string>('auth.signatureMessage')}${user.nonce}`;
    const isValid = verifySignature(dto.address, dto.signature, message);
    if (!isValid) throw new UnauthorizedException('Invalid wallet signature');
    user.nonce = undefined;
    await user.save();

    const payload = { sub: user._id.toString(), address: dto.address };
    const token = await this.jwtService.signAsync(payload);

    return { token, userId: user._id.toString() };
  }

  async getNonce(address: string): Promise<string> {
    let user = await this.userService.getUserByWallet(address) as User;
    console.log(user);
    if (!user) {
      user = await this.userService.createUser(address);
    }

    const nonce = Math.floor(Math.random() * 1000000);
    user.nonce = nonce;
    await user.save();

    const message = `${this.configService.get<string>('auth.signatureMessage')}${nonce}`;

    return message;
  }
}
