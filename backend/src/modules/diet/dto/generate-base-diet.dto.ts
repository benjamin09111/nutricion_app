import {
  IsArray,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';

export class GenerateBaseDietDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'Las instrucciones no pueden superar los 1000 caracteres.',
  })
  instructions?: string;

  @IsArray()
  @ArrayMaxSize(20, {
    message: 'No puedes solicitar más de 20 categorías simultáneamente.',
  })
  @IsString({ each: true })
  categories!: string[];

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxFoodsPerCategory?: number;
}
