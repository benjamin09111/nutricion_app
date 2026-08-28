import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateTestimonialDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  clinic?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  timeSaved?: string;

  @IsString()
  quote: string;

  @IsOptional()
  @IsString()
  highlight?: string;

  @IsOptional()
  @IsString()
  avatarText?: string;

  @IsOptional()
  @IsString()
  avatarBg?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsBoolean()
  isReviewed?: boolean;

  @IsOptional()
  @IsInt()
  displayOrder?: number;
}
