import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { DiscountCodeType } from '@prisma/client';

export class GenerateDiscountCodesDto {
  @IsEnum(DiscountCodeType)
  type!: DiscountCodeType;

  @IsInt()
  @Min(1)
  @Max(100)
  count!: number;
}
