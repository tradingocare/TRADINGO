import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommandInput, GetObjectCommand } from '@aws-sdk/client-s3';

interface UploadResult {
  url: string;
  cdnUrl: string;
}

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly cloudfrontDomain: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('aws.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId')!,
        secretAccessKey: this.configService.get<string>('aws.secretAccessKey')!,
      },
    });
    this.bucket = this.configService.get<string>('aws.bucket')!;
    this.cloudfrontDomain = this.configService.get<string>('aws.cloudfrontDomain') || '';
  }

  async uploadFile(
    buffer: Buffer,
    key: string,
    mimeType: string,
    isPublic: boolean = false,
  ): Promise<UploadResult> {
    const command: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: isPublic ? 'public-read' : 'private',
    };

    await this.s3.send(new PutObjectCommand(command));

    const s3Url = `https://${this.bucket}.s3.${this.configService.get<string>('aws.region')}.amazonaws.com/${key}`;
    const cdnUrl = this.cloudfrontDomain
      ? `https://${this.cloudfrontDomain}/${key}`
      : s3Url;

    return { url: s3Url, cdnUrl };
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async generatePresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3, command, { expiresIn });
  }
}
