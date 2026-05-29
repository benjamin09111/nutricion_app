import {
  IsString,
  IsOptional,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';

export class RequestAppointmentDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsDateString()
  preferredDate?: string;

  @IsOptional()
  @IsString()
  preferredTime?: string;
}
