import {
  IsArray,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class GenerateBaseDietDto {
  @IsOptional()
  @IsString()
  instructions?: string;

  @IsArray()
  @IsString({ each: true })
  categories!: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxFoodsPerCategory?: number;
}
