import { IsArray, ArrayMinSize, IsString } from 'class-validator';

export class VerifyFoodsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  restrictions!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  foodIds!: string[];
}
