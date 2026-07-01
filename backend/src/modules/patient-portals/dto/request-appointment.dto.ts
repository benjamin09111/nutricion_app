import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class RequestAppointmentDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsDateString()
  startAt?: string;

  @IsDateString()
  endAt?: string;
}
