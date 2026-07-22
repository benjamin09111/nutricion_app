import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WhatsAppClient,
  buildTemplateSendPayload,
} from '@kapso/whatsapp-cloud-api';

export interface WhatsAppTextMessageInput {
  to: string;
  body: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppTemplatePayload {
  name: string;
  languageCode?: string;
  parameters: Array<{
    type: 'text';
    text: string;
    parameterName?: string;
  }>;
}

let client: WhatsAppClient | null = null;

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(private readonly configService: ConfigService) {}

  private getClient(): WhatsAppClient {
    if (!client) {
      const apiKey = this.configService.get<string>('KAPSO_API_KEY');
      if (!apiKey) {
        throw new Error('Missing KAPSO_API_KEY environment variable.');
      }
      client = new WhatsAppClient({
        baseUrl: 'https://app.kapso.ai/api/meta/',
        kapsoApiKey: apiKey,
      });
    }
    return client;
  }

  async sendText(input: WhatsAppTextMessageInput): Promise<WhatsAppSendResult> {
    try {
      const phoneNumberId = this.configService.get<string>(
        'KAPSO_PHONE_NUMBER_ID',
      );
      if (!phoneNumberId) throw new Error('Missing KAPSO_PHONE_NUMBER_ID');

      const response = await this.getClient().messages.sendText({
        phoneNumberId,
        to: input.to,
        body: input.body,
      });

      return {
        success: true,
        messageId: response.messages[0]?.id,
      };
    } catch (error) {
      this.logger.error('[WhatsApp] Error enviando mensaje de texto:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  async sendTemplate(
    to: string,
    payload: WhatsAppTemplatePayload,
  ): Promise<WhatsAppSendResult> {
    try {
      const phoneNumberId = this.configService.get<string>(
        'KAPSO_PHONE_NUMBER_ID',
      );
      if (!phoneNumberId) throw new Error('Missing KAPSO_PHONE_NUMBER_ID');

      const bodyParams = payload.parameters.map((param) => ({
        type: 'text' as const,
        text: param.text,
        ...(param.parameterName ? { parameterName: param.parameterName } : {}),
      }));

      const code = payload.languageCode || 'es';

      const templatePayload = buildTemplateSendPayload({
        name: payload.name,
        language: code,
        body: bodyParams,
      });

      const response = await this.getClient().messages.sendTemplate({
        phoneNumberId,
        to,
        template: templatePayload as any,
      });

      return {
        success: true,
        messageId: response.messages[0]?.id,
      };
    } catch (error) {
      this.logger.error('[WhatsApp] Error enviando plantilla:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  async notifyOwnerOfTransfer(transferData: {
    nutritionistName: string;
    nutritionistEmail: string;
    planName: string;
    amount: number;
    paymentId: string;
  }): Promise<WhatsAppSendResult> {
    const ownerPhone = this.configService.get<string>('KAPSO_OWNER_PHONE');
    if (!ownerPhone) {
      this.logger.warn(
        '[WhatsApp] ⚠️ KAPSO_OWNER_PHONE no configurado, omitiendo notificación',
      );
      return { success: false, error: 'KAPSO_OWNER_PHONE no configurado' };
    }

    const formattedPhone = ownerPhone.replace(/\+/g, '').trim();

    const templatePayload: WhatsAppTemplatePayload = {
      name: 'not_pedido',
      languageCode: 'es',
      parameters: [
        {
          type: 'text' as const,
          text: transferData.nutritionistName,
          parameterName: 'nombre_nutricionista',
        },
        {
          type: 'text' as const,
          text: transferData.nutritionistEmail,
          parameterName: 'email_nutricionista',
        },
        {
          type: 'text' as const,
          text: transferData.planName,
          parameterName: 'nombre_plan',
        },
        {
          type: 'text' as const,
          text: `$${transferData.amount.toLocaleString('es-CL')}`,
          parameterName: 'monto',
        },
        {
          type: 'text' as const,
          text: transferData.paymentId,
          parameterName: 'id_pago',
        },
      ],
    };

    this.logger.log(`[WhatsApp] 📱 Enviando WhatsApp al dueño`);
    this.logger.log(`[WhatsApp]   → Para: ${formattedPhone}`);
    this.logger.log(
      `[WhatsApp]   → Nutri: ${transferData.nutritionistName} (${transferData.nutritionistEmail})`,
    );
    this.logger.log(
      `[WhatsApp]   → Plan: ${transferData.planName} | Monto: $${transferData.amount.toLocaleString('es-CL')}`,
    );
    this.logger.log(`[WhatsApp]   → Payment ID: ${transferData.paymentId}`);
    this.logger.log(`[WhatsApp]   → Template: not_pedido`);

    const result = await this.sendTemplate(formattedPhone, templatePayload);

    if (result.success) {
      this.logger.log(
        `[WhatsApp] ✅ WhatsApp enviado. Message ID: ${result.messageId}`,
      );
    } else {
      this.logger.error(
        `[WhatsApp] ❌ Error enviando WhatsApp: ${result.error}`,
      );
    }

    return result;
  }
}
