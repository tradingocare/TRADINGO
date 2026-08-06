import { IsString, IsOptional, IsObject, IsArray, IsEnum, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CollaborationPattern } from '../interfaces/federation.interfaces';

export class FederationNodeDto {
  @IsString()
  @ApiProperty({ description: 'Node ID' })
  id: string;
  @IsString()
  @ApiProperty({ description: 'Agent ID' })
  agentId: string;
  @IsString()
  @ApiProperty({ description: 'Capability ID' })
  capabilityId: string;
  @IsEnum({ single: 'single', parallel: 'parallel', sequential: 'sequential', conditional: 'conditional', nested: 'nested', coordinator: 'coordinator' } as object)
  @ApiProperty({ description: 'Collaboration pattern', enum: ['single', 'parallel', 'sequential', 'conditional', 'nested', 'coordinator'] })
  pattern: CollaborationPattern;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ description: 'Dependencies' })
  dependsOn?: string[];
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FederationNodeDto)
  @ApiPropertyOptional({ description: 'Child nodes', type: () => [FederationNodeDto] })
  children?: FederationNodeDto[];
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Condition' })
  condition?: string;
  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({ description: 'Configuration' })
  config?: Record<string, unknown>;
}

export class CollaborationRequestDto {
  @IsString()
  @ApiProperty({ description: 'Company ID' })
  companyId: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'User ID' })
  userId?: string;
  @IsString()
  @ApiProperty({ description: 'Role' })
  role: string;
  @IsObject()
  @ApiProperty({ description: 'Request payload' })
  payload: Record<string, unknown>;
  @IsString()
  @ApiProperty({ description: 'Workflow ID' })
  workflowId?: string;
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FederationNodeDto)
  @ApiPropertyOptional({ description: 'Workflow nodes', type: () => [FederationNodeDto] })
  nodes?: FederationNodeDto[];
}

export class AgentMessageDto {
  @IsString()
  @ApiProperty({ description: 'Target agent ID' })
  toAgentId: string;
  @IsString()
  @ApiProperty({ description: 'Action to perform' })
  action: string;
  @IsObject()
  @ApiProperty({ description: 'Message payload' })
  payload: Record<string, unknown>;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Collaboration ID' })
  collaborationId?: string;
}

export class AgentQueryDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Agent role' })
  role?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Agent tag' })
  tag?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Capability ID' })
  capabilityId?: string;
}
