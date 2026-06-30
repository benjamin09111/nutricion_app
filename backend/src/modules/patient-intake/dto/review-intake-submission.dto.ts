import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';

export class ReviewIntakeSubmissionDto {
  @IsString()
  @IsIn(['APPROVED', 'REJECTED'], {
    message: 'La acción debe ser APPROVED o REJECTED',
  })
  action: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'El motivo de rechazo no puede exceder 500 caracteres',
  })
  rejectReason?: string;
}
