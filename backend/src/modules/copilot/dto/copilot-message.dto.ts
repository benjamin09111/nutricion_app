import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CopilotMessageDto {
  @IsString()
  @MaxLength(2000, {
    message: 'El mensaje no puede superar los 2000 caracteres.',
  })
  message: string;

  @IsString()
  @IsOptional()
  patientId?: string;

  @IsString()
  @IsOptional()
  conversationId?: string;
}

export class CopilotMemoryDto {
  @IsString()
  @MaxLength(100)
  key: string;

  @IsString()
  @MaxLength(2000)
  value: string;
}
