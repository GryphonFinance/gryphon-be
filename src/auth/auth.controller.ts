import { Controller, Post, Body, Res, HttpCode, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { WalletLoginDto } from './dto/wallet-login.dto';
import { Response } from 'express';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('wallet-login')
  @HttpCode(200)
  async walletLogin(@Body() dto: WalletLoginDto, @Res({ passthrough: true }) res: Response) {
    const { token, userId } = await this.authService.loginWithWallet(dto);

    res.cookie('jwt', token, {
      httpOnly: false,
      secure: false,
      sameSite: 'none', // strict
      maxAge: 86400000,
    });

    return { userId };
  }

    @Public()
    @Get('nonce')
    async getNonce(@Query('address') address: string) {
        return { signatureMessage: await this.authService.getNonce(address) };
    }
}
