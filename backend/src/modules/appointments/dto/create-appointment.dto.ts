import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  IsNotEmpty,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  calendarId: string;

  @IsOptional()
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsString()
  patientName?: string;

  @IsOptional()
  @IsString()
  patientEmail?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsDateString()
  start: string;

  @IsDateString()
  end: string;

  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(60)
  durationMin: number;

  @IsOptional()
  @IsString()
  timeZone?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  notifyPatientByEmail?: boolean;
}
