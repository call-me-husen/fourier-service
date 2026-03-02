import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as path from 'path';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class ImageUploadPipe implements PipeTransform {
  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file || !file.buffer) {
      throw new BadRequestException('File is required');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException(`Invalid file type "${file.mimetype}".`);
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size ${file.size} bytes exceeds the limit`,
      );
    }

    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    file.originalname = `${randomUUID()}${ext}`;

    return file;
  }
}
