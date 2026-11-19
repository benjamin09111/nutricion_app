import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';
import { UserRole, AccountStatus, SubscriptionPlan } from '@prisma/client';

export class UpdateMySettingsDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]{3,60}$/, {
    message: 'El slug debe contener entre 3 y 60 caracteres en minúsculas (letras, números y guiones).',
  })
  publicSlug?: string;

  @IsOptional()
  @IsBoolean()
  publicProfileEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'El titular no puede exceder 150 caracteres.' })
  headline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'La biografía no puede exceder 2000 caracteres.' })
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  consultationMode?: string;

  @IsOptional()
  @IsObject({ message: 'La configuración debe ser un objeto válido.' })
  settings?: Record<string, any>;
}

export class AdminUpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole, { message: 'Rol de usuario inválido.' })
  role?: UserRole;

  @IsOptional()
  @IsEnum(AccountStatus, { message: 'Estado de cuenta inválido.' })
  status?: AccountStatus;

  @IsOptional()
  @IsEnum(SubscriptionPlan, { message: 'Plan inválido.' })
  plan?: SubscriptionPlan;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  rut?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;
}

export class UpdateUserPlanDto {
  @IsEnum(SubscriptionPlan, { message: 'Plan inválido.' })
  plan: SubscriptionPlan;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  days?: number;

  @IsOptional()
  @IsBoolean()
  recordPayment?: boolean;
}

export class UpdatePublicProfileVisibilityDto {
  @IsBoolean({ message: 'El valor de visibilidad debe ser booleano.' })
  publicProfileEnabled: boolean;
}

export class AcceptDeletionRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Las notas no pueden exceder 500 caracteres.' })
  notes?: string;
}
