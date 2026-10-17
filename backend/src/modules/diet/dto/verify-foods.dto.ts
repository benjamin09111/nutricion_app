import { IsArray, ArrayMinSize, ArrayMaxSize, IsString } from 'class-validator';

export class VerifyFoodsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50, {
    message: 'No puedes verificar más de 50 restricciones a la vez.',
  })
  @IsString({ each: true })
  restrictions!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200, {
    message: 'No puedes verificar más de 200 alimentos a la vez.',
  })
  @IsString({ each: true })
  foodIds!: string[];
}
