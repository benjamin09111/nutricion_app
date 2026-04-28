import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreatePatientPortalNotificationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}
