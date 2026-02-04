import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateNutritionistDto } from './dto/create-nutritionist.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register-nutritionist')
    @HttpCode(HttpStatus.CREATED)
    createNutritionist(@Body() createNutritionistDto: CreateNutritionistDto) {
        return this.authService.createNutritionist(createNutritionistDto.email);
    }
    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    resetPassword(@Body() createNutritionistDto: CreateNutritionistDto) {
        return this.authService.resetNutritionistPassword(createNutritionistDto.email);
    }
}
