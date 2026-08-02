import { Controller, Post, Get, Param, Body, Query, UseGuards, HttpCode, HttpStatus, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { CatalogImportService } from './catalog-import.service';
import { CsvParserService } from './services/csv-parser.service';
import { ImportOrchestratorService } from './services/import-orchestrator.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ImportJobType, ImportJobStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RateLimits } from '../common/constants/rate-limits.const';

const ALLOWED_IMPORT_MIME = [
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/plain',
  'application/json',
];

const ALLOWED_IMPORT_EXTS = ['.csv', '.xlsx', '.xls', '.txt', '.json'];
const MAX_IMPORT_SIZE = 50 * 1024 * 1024;

@Controller('catalog-import')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
@Throttle(RateLimits.ADMIN_WRITE)
export class CatalogImportController {
  constructor(
    private readonly catalogImportService: CatalogImportService,
    private readonly csvParserService: CsvParserService,
    private readonly importOrchestratorService: ImportOrchestratorService,
  ) {}

  private validateImportFile(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    const ext = file.originalname?.toLowerCase().split('.').pop();
    if (!ext || !ALLOWED_IMPORT_EXTS.includes(`.${ext}`)) {
      throw new BadRequestException(`Unsupported file extension: .${ext}`);
    }
    if (!ALLOWED_IMPORT_MIME.includes(file.mimetype) && file.mimetype !== 'application/octet-stream') {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }
    if (file.size > MAX_IMPORT_SIZE) {
      throw new BadRequestException(`File exceeds maximum size of 50MB`);
    }
  }

  @Post('import')
  async startImport(
    @Body() body: { type: ImportJobType; data: any[] },
  ) {
    return this.catalogImportService.startImport(body.type, body.data);
  }

  @Post('start')
  async startImportAlias(
    @Body() body: { type: ImportJobType; data?: any[]; fileUrl?: string },
  ) {
    return this.catalogImportService.startImport(body.type, body.data || []);
  }

  @Post('csv-import')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body('companyId') companyId: string | undefined,
    @CurrentUser() user: any,
  ) {
    this.validateImportFile(file);
    const effectiveCompanyId = companyId || user?.companyId;
    if (!effectiveCompanyId) {
      throw new BadRequestException('companyId is required');
    }
    return this.importOrchestratorService.runFullImport(file.buffer, effectiveCompanyId);
  }

  @Post('file-import')
  @UseInterceptors(FileInterceptor('file'))
  async importFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('companyId') companyId: string | undefined,
    @CurrentUser() user: any,
  ) {
    this.validateImportFile(file);
    const effectiveCompanyId = companyId || user?.companyId;
    if (!effectiveCompanyId) {
      throw new BadRequestException('companyId is required');
    }

    const isXlsx = file.originalname?.endsWith('.xlsx')
      || file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      || (file.buffer[0] === 0x50 && file.buffer[1] === 0x4b);

    const format = isXlsx ? 'xlsx' as const : 'csv' as const;
    return this.importOrchestratorService.runFullImport(file.buffer, effectiveCompanyId, undefined, format);
  }

  @Post('csv-import/:jobId/resume')
  @HttpCode(HttpStatus.OK)
  async resumeImport(
    @Param('jobId') jobId: string,
    @Body('companyId') companyId: string | undefined,
    @CurrentUser() user: any,
  ) {
    const effectiveCompanyId = companyId || user?.companyId;
    if (!effectiveCompanyId) {
      throw new BadRequestException('companyId is required');
    }
    return this.importOrchestratorService.resumeImport(jobId, effectiveCompanyId);
  }

  @Post('csv-preview')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async previewCsv(@UploadedFile() file: Express.Multer.File) {
    this.validateImportFile(file);
    const result = this.csvParserService.parse(file.buffer);
    return {
      totalRows: result.totalRows,
      validRows: result.validRows,
      invalidRows: result.invalidRows,
      categories: result.categories.length,
      subcategories: [...result.subcategories.values()].reduce((sum, s) => sum + s.length, 0),
      products: result.products.length,
      services: result.services.length,
      errors: result.errors.slice(0, 20),
      sample: result.rows.slice(0, 5),
    };
  }

  @Get('import')
  async getJobs(
    @Query('type') type?: ImportJobType,
    @Query('status') status?: ImportJobStatus,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const result = await this.catalogImportService.getJobs({
      type,
      status,
      cursor,
      limit: limit ? parseInt(limit, 10) : 20,
      page: page ? parseInt(page, 10) : undefined,
    });
    return result;
  }

  @Get('jobs')
  async getJobsNew(
    @Query('type') type?: ImportJobType,
    @Query('status') status?: ImportJobStatus,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const result = await this.catalogImportService.getJobs({
      type,
      status,
      cursor,
      limit: limit ? parseInt(limit, 10) : 20,
      page: page ? parseInt(page, 10) : undefined,
    });
    return result;
  }

  @Get('import/:id')
  async getJob(@Param('id') id: string) {
    return this.catalogImportService.getJob(id);
  }

  @Get('jobs/:id')
  async getJobNew(@Param('id') id: string) {
    return this.catalogImportService.getJob(id);
  }

  @Post('import/:id/rollback')
  @HttpCode(HttpStatus.OK)
  async rollbackImport(@Param('id') id: string) {
    return this.catalogImportService.rollbackImport(id);
  }

  @Post('jobs/:id/rollback')
  @HttpCode(HttpStatus.OK)
  async rollbackImportNew(@Param('id') id: string) {
    return this.catalogImportService.rollbackImport(id);
  }

  @Post('jobs/:id/retry')
  @HttpCode(HttpStatus.OK)
  async retryImport(@Param('id') id: string) {
    return this.catalogImportService.retryImport(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    this.validateImportFile(file);
    return this.catalogImportService.uploadFile(file);
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  async previewImport(@Body() body: { type: ImportJobType; data?: any[] }) {
    return this.catalogImportService.previewImport(body.type, body.data || []);
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateImport(@Body() body: { type: ImportJobType; data?: any[] }) {
    return this.catalogImportService.validateImport(body.type, body.data || []);
  }

  @Get('search')
  async searchCatalog(
    @Query('q') query: string,
    @Query('type') type?: 'PRODUCT' | 'SERVICE',
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogImportService.searchCatalog(query || '', {
      type,
      categoryId,
      subcategoryId,
      cursor,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get('stats')
  async getStats() {
    return this.catalogImportService.getJobStats();
  }
}
