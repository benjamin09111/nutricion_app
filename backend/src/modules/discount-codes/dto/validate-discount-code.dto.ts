import { IsString, IsNotEmpty } from 'class-validator';

export class ValidateDiscountCodeDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  planId!: string;
}
