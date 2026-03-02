import { Injectable } from '@nestjs/common';
import ImageKit from 'imagekit';
import { ConfigService } from '../config/config.service';

@Injectable()
export class ImageKitService {
  private imageKit: ImageKit;

  constructor(private readonly configService: ConfigService) {
    this.imageKit = new ImageKit({
      publicKey: this.configService.imageKitPublicKey,
      privateKey: this.configService.imageKitPrivateKey,
      urlEndpoint: this.configService.imageKitUrlEndpoint,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = '/uploads',
  ): Promise<string> {
    const response = await this.imageKit.upload({
      file: file.buffer,
      fileName: file.originalname, // already a UUID-based name from ImageUploadPipe
      folder,
    });

    return response.url;
  }
}
