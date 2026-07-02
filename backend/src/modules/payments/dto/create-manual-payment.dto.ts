import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CreateManualPaymentDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsEmail()
  @IsOptional()
  nutritionistEmail?: string;

  @IsString()
  @IsOptional()
  nutritionistName?: string;
}
