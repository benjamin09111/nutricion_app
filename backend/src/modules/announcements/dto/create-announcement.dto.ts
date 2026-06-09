import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  targetRoles?: string[];

  @IsString()
  @IsOptional()
  @IsIn(['all', 'specific', 'list'])
  targetMode?: 'all' | 'specific' | 'list';

  @IsString()
  @IsOptional()
  specificUserId?: string;

  @IsString()
  @IsOptional()
  emailList?: string;

  @IsString()
  @IsOptional()
  @IsIn(['email', 'announcement'])
  commType?: 'email' | 'announcement';

  @IsString()
  @IsOptional()
  @IsIn([
    'notificaciones@nutrinet.cl',
    'soporte@nutrinet.cl',
    'pagos@nutrinet.cl',
    'info@nutrinet.cl',
    'seguridad@nutrinet.cl',
    'marketing@nutrinet.cl',
    'rrhh@nutrinet.cl',
  ])
  fromEmail?: string;
}
