import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CalculationsService, CalculationInputs } from './calculations.service';
import { ExchangePortionsService } from './exchange-portions.service';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequireFeatures } from '../permissions/permissions.decorator';
import { PLAN_ENTITLEMENT_KEYS } from '../memberships/plan-entitlements';
import { PlanUsageService } from '../permissions/plan-usage.service';
import { CalculateDto } from './dto/calculate.dto';
import {
  DetectExchangeDto,
  CalculateExchangeDto,
  CalculateGramsDto,
  SuggestExchangesDto,
} from './dto/exchange-portions.dto';

@Controller('calculations')
@UseGuards(AuthGuard, PermissionsGuard)
@RequireFeatures(PLAN_ENTITLEMENT_KEYS.CLINICAL_CALCULATOR_USE_ACCESS)
export class CalculationsController {
  constructor(
    private readonly calculationsService: CalculationsService,
    private readonly exchangePortionsService: ExchangePortionsService,
    private readonly planUsageService: PlanUsageService,
  ) {}

  @Post('calculate')
  async calculate(@Request() req: any, @Body() inputs: CalculateDto) {
    await this.planUsageService.consumeQuota(
      req.user.id,
      PLAN_ENTITLEMENT_KEYS.CLINICAL_CALCULATOR_LIMIT,
    );
    return this.calculationsService.calculateAll(inputs as CalculationInputs);
  }

  @Get('exchange-portions/profiles')
  getExchangeProfiles() {
    return this.exchangePortionsService.getProfiles();
  }

  @Get('exchange-portions/coverage')
  getExchangeCoverage() {
    return this.exchangePortionsService.getExchangeCoverageRows();
  }

  @Post('exchange-portions/detect')
  detectExchangeProfile(@Body() body: DetectExchangeDto) {
    return this.exchangePortionsService.detectProfile(body);
  }

  @Post('exchange-portions/calculate')
  calculateExchange(@Body() body: CalculateExchangeDto) {
    return this.exchangePortionsService.calculateExchange(body);
  }

  @Post('exchange-portions/grams')
  calculateGramsForExchange(@Body() body: CalculateGramsDto) {
    return this.exchangePortionsService.calculateGrams(body);
  }

  @Post('exchange-portions/suggest')
  suggestExchanges(@Body() body: SuggestExchangesDto) {
    return this.exchangePortionsService.buildSuggestedExchangeRows(body);
  }
}
