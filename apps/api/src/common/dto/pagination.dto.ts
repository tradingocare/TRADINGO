import { IsOptional, IsInt, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class PaginationDto {
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

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsString()
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    cursor?: string;
    sort?: string;
    order?: string;
  };
}

export interface PaginationQuery {
  page: number;
  limit: number;
  skip: number;
  sort: string;
  order: 'asc' | 'desc';
  search?: string;
}

export function buildPaginationQuery(dto: PaginationDto): PaginationQuery {
  const page = dto.page || 1;
  const limit = dto.limit || 20;
  return {
    page,
    limit,
    skip: (page - 1) * limit,
    sort: dto.sort || 'createdAt',
    order: (dto.order || SortOrder.DESC) as 'asc' | 'desc',
    search: dto.search,
  };
}

export function buildPaginatedResult<T>(data: T[], total: number, query: PaginationQuery): PaginatedResult<T> {
  const totalPages = Math.ceil(total / query.limit);
  return {
    data,
    meta: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages,
      hasNext: query.page < totalPages,
      hasPrevious: query.page > 1,
      sort: query.sort,
      order: query.order,
    },
  };
}
