import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CopilotMessageDto {
  @IsString()
  message: string;

  @IsNumber()
  @IsOptional()
  patientId?: number;

  @IsString()
  @IsOptional()
  conversationId?: string;
}

export class CopilotMemoryDto {
  @IsString()
  key: string;

  @IsString()
  value: string;
}
