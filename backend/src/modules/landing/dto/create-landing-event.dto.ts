import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLandingEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  eventType: string; // 'PAGE_VIEW' | 'HERO_CTA_CLICK' | 'FEATURE_CLICK' | 'COMPARISON_VIEW' | 'PRICING_VIEW' | 'LEAD_SUBMIT'

  @IsString()
  @IsOptional()
  @MaxLength(255)
  pagePath?: string;

  @IsOptional()
  metadata?: any;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  referrer?: string;
}
