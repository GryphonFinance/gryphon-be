import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from './s3.service';
import { Public } from 'src/auth/decorators/public.decorator';
@Controller('images')
export class ImageController {
    constructor(private readonly s3Service: S3Service) { }

    @Public()
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        return await this.s3Service.uploadFile(file);
    }
}
