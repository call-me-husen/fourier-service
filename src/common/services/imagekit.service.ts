import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ImageKit from 'imagekit';

type UploadableFile = {
  buffer: Buffer;
  originalname: string;
};

@Injectable()
export class ImageKitService {
  private readonly client: ImageKit;

  constructor(private readonly configService: ConfigService) {
    this.client = new ImageKit({
      publicKey: this.configService.get<string>('IMAGEKIT_PUBLIC_KEY', ''),
      privateKey: this.configService.get<string>('IMAGEKIT_PRIVATE_KEY', ''),
      urlEndpoint: this.configService.get<string>('IMAGEKIT_URL_ENDPOINT', ''),
    });
  }

  async uploadProfileImage(
    file: UploadableFile,
    employeeId: string,
  ): Promise<string> {
    const publicKey = this.configService.get<string>('IMAGEKIT_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('IMAGEKIT_PRIVATE_KEY');
    const urlEndpoint = this.configService.get<string>('IMAGEKIT_URL_ENDPOINT');

    if (!publicKey || !privateKey || !urlEndpoint) {
      throw new InternalServerErrorException(
        'ImageKit configuration is incomplete',
      );
    }

    const uploaded = await this.client.upload({
      file: file.buffer,
      fileName: `${employeeId}-${Date.now()}`,
      folder: '/fourier-service/profile-images',
      useUniqueFileName: true,
    });

    return uploaded.url;
  }
}
