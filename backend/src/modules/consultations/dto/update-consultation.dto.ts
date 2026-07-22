import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConsultationMetricDto } from './create-consultation.dto';

/**
 * DTO de actualización de consulta.
 * No se permite cambiar el patientId una vez creada la consulta.
 */
export class UpdateConsultationDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsultationMetricDto)
  @IsOptional()
  metrics?: ConsultationMetricDto[];

  @IsBoolean()
  @IsOptional()
  plansDelivered?: boolean;
}
