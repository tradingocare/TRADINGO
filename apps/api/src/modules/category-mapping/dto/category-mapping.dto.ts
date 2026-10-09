import { IsArray, IsString } from 'class-validator';

export type CategoryMappingRelationType = 'EXACT' | 'RELATED' | 'ONE_TO_MANY';

export class MappingTarget {
  catalogCategoryId: string;
  catalogSlug: string;
  relationType: CategoryMappingRelationType;
  confidence: number;
  isPrimary: boolean;
}

export class ResolveMappingResponse {
  legacySlug: string;
  resolved: boolean;
  targets: MappingTarget[];
  primary: MappingTarget | null;
}

export class BatchResolveMappingsDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

export class BatchResolvedEntry {
  legacyCategoryId: string;
  legacyName?: string;
  targets: MappingTarget[];
  primary: MappingTarget | null;
}

export class BatchResolveMappingsResponse {
  resolved: BatchResolvedEntry[];
  unresolved: { legacyCategoryId: string; legacyName?: string }[];
  totalInput: number;
  resolvedCount: number;
  unresolvedCount: number;
}

export class ReverseMappingSource {
  legacyCategoryId: string;
  legacySlug: string;
  relationType: CategoryMappingRelationType;
  confidence: number;
  isPrimary: boolean;
}

export class ReverseResolveResponse {
  catalogSlug: string;
  resolved: boolean;
  sources: ReverseMappingSource[];
  primary: ReverseMappingSource | null;
}
