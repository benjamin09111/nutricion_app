import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['CLINICAL', 'GENERAL'])
  mode?: 'CLINICAL' | 'GENERAL';

  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'ACTIVE', 'ARCHIVED'])
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

  @IsOptional()
  @IsUUID()
  activeDietCreationId?: string;

  @IsOptional()
  @IsUUID()
  activeRecipeCreationId?: string;

  @IsOptional()
  @IsUUID()
  activeCartCreationId?: string;

  @IsOptional()
  @IsUUID()
  activeDeliverableCreationId?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
