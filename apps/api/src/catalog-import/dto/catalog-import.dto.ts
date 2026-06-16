import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ImportJobType, ImportJobStatus, ImportRowStatus } from '@prisma/client';

export class StartImportDto {
  @IsEnum([...Object.values(ImportJobType), 'ALL'])
  type: ImportJobType | 'ALL';

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  data?: Record<string, unknown>[];
}

export class ImportJobRowResponse {
  id: string;
  importJobId: string;
  rowNumber: number;
  status: ImportRowStatus;
  entityType: string | null;
  entityId: string | null;
  rawData: Record<string, unknown> | null;
  validatedData: Record<string, unknown> | null;
  errors: string[];
  warnings: string[];
  checksum: string | null;
  duplicateOf: string | null;
  importedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class ImportJobResponse {
  id: string;
  type: ImportJobType;
  status: ImportJobStatus;
  fileName: string | null;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedRows: number;
  skippedRows: number;
  duplicateRows: number;
  errorRows: number;
  summary: Record<string, unknown> | null;
  errorLog: string | null;
  startedAt: string | null;
  completedAt: string | null;
  rolledBackAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  rows?: ImportJobRowResponse[];
}

export class ImportJobListResponse {
  jobs: ImportJobResponse[];
  total: number;
  page: number;
  limit: number;
}

export class SearchCatalogDto {
  @IsString()
  q: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class SearchCatalogResponse {
  products: {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    status: string;
    unit: string | null;
  }[];
  services: {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    status: string;
    unit: string | null;
  }[];
  total: number;
}

export class ImportStatsResponse {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  runningJobs: number;
  totalCategories: number;
  totalSubcategories: number;
  totalProducts: number;
  totalServices: number;
}
