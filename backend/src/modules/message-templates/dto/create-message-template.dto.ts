import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateMessageTemplateDto {
  @IsString()
  title: string;

  @IsString()
  subject: string;

  @IsString()
  content: string;

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
