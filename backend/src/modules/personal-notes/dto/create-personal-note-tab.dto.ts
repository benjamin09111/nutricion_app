import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePersonalNoteTabDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  title!: string;
}
