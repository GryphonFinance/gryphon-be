import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { ImageController } from './s3.controller';

@Module({
  providers: [S3Service],
  exports: [S3Service],
  controllers: [ImageController],
})
export class S3Module {}
