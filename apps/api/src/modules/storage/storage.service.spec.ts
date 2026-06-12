import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

const mockS3Send = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  const mockS3Client = jest.fn(() => ({ send: mockS3Send }));
  return {
    S3Client: mockS3Client,
    PutObjectCommand: jest.fn((input) => input),
    DeleteObjectCommand: jest.fn((input) => input),
    GetObjectCommand: jest.fn((input) => input),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(() => Promise.resolve('https://presigned.example.com/file.pdf')),
}));

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                'aws.region': 'ap-south-1',
                'aws.accessKeyId': 'test-key',
                'aws.secretAccessKey': 'test-secret',
                'aws.bucket': 'tradingo-test',
                'aws.cloudfrontDomain': 'cdn.tradingo.in',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();
    service = module.get<StorageService>(StorageService);
  });

  describe('uploadFile', () => {
    it('should upload a public file and return URLs', async () => {
      mockS3Send.mockResolvedValue({});
      const buffer = Buffer.from('test content');

      const result = await service.uploadFile(buffer, 'images/test.jpg', 'image/jpeg', true);

      expect(result.url).toContain('tradingo-test.s3.ap-south-1.amazonaws.com/images/test.jpg');
      expect(result.cdnUrl).toBe('https://cdn.tradingo.in/images/test.jpg');
      expect(mockS3Send).toHaveBeenCalled();
    });

    it('should upload a private file', async () => {
      mockS3Send.mockResolvedValue({});
      const buffer = Buffer.from('private content');

      const result = await service.uploadFile(buffer, 'private/doc.pdf', 'application/pdf');

      expect(result.url).toBeDefined();
      expect(result.cdnUrl).toBeDefined();
    });
  });

  describe('deleteFile', () => {
    it('should delete a file from S3', async () => {
      mockS3Send.mockResolvedValue({});
      await service.deleteFile('images/test.jpg');
      expect(mockS3Send).toHaveBeenCalledTimes(1);
    });
  });

  describe('generatePresignedUrl', () => {
    it('should generate a presigned URL', async () => {
      mockS3Send.mockResolvedValue({});
      const url = await service.generatePresignedUrl('private/doc.pdf', 3600);
      expect(url).toBe('https://presigned.example.com/file.pdf');
    });
  });
});
