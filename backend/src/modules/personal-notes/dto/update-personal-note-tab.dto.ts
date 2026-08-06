import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdatePersonalNoteTabDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100_000)
  content?: string;

  @IsInt()
  @Min(0)
  expectedVersion!: number;
}
