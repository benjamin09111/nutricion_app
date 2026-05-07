import { Module, Global } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailService } from './mail.service';
import { join } from 'path';

@Global()
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.MAIL_PORT || '587'),
        secure: process.env.MAIL_SECURE === 'true', // true for 465
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
        family: 4, // FORZAR IPv4 para evitar problemas de red en Railway
        tls: {
          rejectUnauthorized: false,
        },

      },
      defaults: {
        from: `"NutriNet" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
      },
      template: {
        dir: join(process.cwd(), 'dist', 'modules', 'mail', 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),

  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}

