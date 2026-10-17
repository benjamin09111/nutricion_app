import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLandingLeadDto {
  @IsString()
  @IsOptional()
  @IsIn(['NUEVO', 'CONTACTADO', 'CONVERTIDO', 'DESCARTADO'], {
    message: 'El estado debe ser NUEVO, CONTACTADO, CONVERTIDO o DESCARTADO',
  })
  status?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
