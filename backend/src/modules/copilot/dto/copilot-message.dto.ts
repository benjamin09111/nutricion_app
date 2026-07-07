import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CopilotMessageDto {
  @IsString()
  message: string;

  @IsOptional()
  @IsNumber()
  patientId?: number;

  @IsOptional()
  @IsString()
  conversationId?: string;
}

export class CopilotMemoryDto {
  @IsString()
  key: string;

  @IsString()
  value: string;
}
