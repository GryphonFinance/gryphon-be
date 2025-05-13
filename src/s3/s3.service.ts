import { Injectable, BadRequestException } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private s3: AWS.S3;
  private bucketName: string;
  private env: string;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get<string>('aws.accessKeyId'),
      secretAccessKey: this.configService.get<string>('aws.secretAccessKey'),
      region: this.configService.get<string>('aws.region'),
    });
    this.bucketName = this.configService.get<string>('aws.bucket') || '';
    this.env = this.configService.get<string>('nodeEnv') || 'development';
  }

  async uploadFile(file: Express.Multer.File) {
    const fileExtension = file.originalname.split('.').pop();
    const filename = `${uuidv4()}.${fileExtension}`;
    const key = `${this.env}/${filename}`;

    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      const data = await this.s3.upload(params).promise();
      return {
        filename,
        url: data.Location,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }
}
