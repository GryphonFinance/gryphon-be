import { IsString } from 'class-validator';

export class WalletLoginDto {
  @IsString()
  address: string;

  @IsString()
  signature: string;
}
