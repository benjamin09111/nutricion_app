import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { PatientIntakeService } from './patient-intake.service';
import { SubmitIntakeFormDto } from './dto/submit-intake-form.dto';

@Controller('public/patient-intake')
export class PublicPatientIntakeController {
  constructor(private readonly intakeService: PatientIntakeService) {}

  @Get('validate/:token')
  async validateLink(@Param('token') token: string) {
    if (!token || token.length < 10) {
      throw new BadRequestException('Token inválido');
    }

    const result = await this.intakeService.validateToken(token);

    if (!result.valid) {
      return {
        valid: false,
        reason: result.reason,
        message: this.getMessageForReason(result.reason!),
      };
    }

    return {
      valid: true,
      nutritionistName: result.nutritionist?.fullName,
      specialty: result.nutritionist?.specialty,
    };
  }

  private getMessageForReason(reason: string): string {
    switch (reason) {
      case 'DISABLED':
        return 'Este formulario no está activo actualmente.';
      case 'EXPIRED':
        return 'Este formulario ha expirado.';
      default:
        return 'Este formulario no existe o no es válido.';
    }
  }

  @Post('submit/:token')
  async submitForm(
    @Param('token') token: string,
    @Body() dto: SubmitIntakeFormDto,
  ) {
    if (!token || token.length < 10) {
      throw new BadRequestException('Token inválido');
    }

    return this.intakeService.submitIntakeForm(token, dto);
  }
}
