import { IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ProductEventDto {
  @IsString()
  @MaxLength(80)
  eventName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  anonymousId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86_400_000)
  durationMs?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string | number | boolean | null>;
}
