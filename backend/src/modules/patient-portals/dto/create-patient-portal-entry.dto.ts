import { IsOptional, IsString } from 'class-validator';

export class CreatePatientPortalEntryDto {
  @IsOptional()
  @IsString()
  entryDate?: string;

  @IsOptional()
  @IsString()
  alimentacion?: string;

  @IsOptional()
  @IsString()
  suplementos?: string;

  @IsOptional()
  @IsString()
  actividadFisica?: string;
}
