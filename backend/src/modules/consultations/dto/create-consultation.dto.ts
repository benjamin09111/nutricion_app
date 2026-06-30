import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsDateString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ConsultationMetricDto {
  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsOptional()
  value?: string | number | null;

  @IsString()
  @IsOptional()
  unit?: string;
}

export class CreateConsultationDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsultationMetricDto)
  @IsOptional()
  metrics?: ConsultationMetricDto[];
}
