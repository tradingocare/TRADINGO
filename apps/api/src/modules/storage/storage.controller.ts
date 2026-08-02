import { Controller, Post, UseGuards, UploadedFiles, UseInterceptors, Body, BadRequestException, ParseArrayPipe } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { v4 as uuid } from 'uuid';
import * as path from 'path';

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
  'application/zip', 'application/x-zip-compressed',
  'video/mp4', 'video/mpeg', 'video/webm',
];

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
  '.txt', '.csv',
  '.zip',
  '.mp4', '.mpeg', '.webm',
];

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_FILES = 20;

const SANITIZE_FOLDER_RE = /[^\w\-/]/g;

@ApiTags('Storage')
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  private validateFile(file: Express.Multer.File, index: number) {
    if (!file) throw new BadRequestException(`File at index ${index} is missing`);
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(`File "${file.originalname}" has unsupported type: ${file.mimetype}`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`File "${file.originalname}" exceeds maximum size of 100MB`);
    }
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(`File "${file.originalname}" has unsupported extension: ${ext}`);
    }
  }

  private sanitizeFolder(folder: string): string {
    return folder.replace(SANITIZE_FOLDER_RE, '_');
  }

  @Post()
  @ApiOperation({ summary: 'Upload a file' })
  @UseInterceptors(FilesInterceptor('file', MAX_FILES))
  async uploadFile(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder: string,
    @CurrentUser('sub') userId: string,
  ) {
    if (!files?.length) throw new BadRequestException('No file provided');
    const file = files[0];
    this.validateFile(file, 0);
    const safeFolder = folder ? this.sanitizeFolder(folder) : 'uploads';
    const ext = path.extname(file.originalname);
    const key = `${safeFolder}/${userId}/${uuid()}${ext}`;
    const result = await this.storageService.uploadFile(file.buffer, key, file.mimetype, true);
    return { url: result.cdnUrl || result.url, key, originalName: file.originalname, size: file.size, mimeType: file.mimetype };
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Upload multiple files' })
  @UseInterceptors(FilesInterceptor('files', MAX_FILES))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder: string,
    @CurrentUser('sub') userId: string,
  ) {
    if (!files?.length) throw new BadRequestException('No files provided');
    if (files.length > MAX_FILES) throw new BadRequestException(`Maximum ${MAX_FILES} files allowed`);

    const uploaded = [];
    const seenNames = new Set<string>();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.validateFile(file, i);
      if (seenNames.has(file.originalname)) continue;
      seenNames.add(file.originalname);
      const safeFolder = folder ? this.sanitizeFolder(folder) : 'uploads';
      const ext = path.extname(file.originalname);
      const key = `${safeFolder}/${userId}/${uuid()}${ext}`;
      const result = await this.storageService.uploadFile(file.buffer, key, file.mimetype, true);
      uploaded.push({ url: result.cdnUrl || result.url, key, originalName: file.originalname, size: file.size, mimeType: file.mimetype });
    }
    return { files: uploaded, total: uploaded.length, duplicatesSkipped: files.length - uploaded.length };
  }
}
