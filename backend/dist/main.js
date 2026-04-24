"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const sanitization_pipe_1 = require("./common/pipes/sanitization.pipe");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
    app.enableCors({
        origin: true,
        credentials: true,
    });
    app.use((0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 500,
        message: { statusCode: 429, message: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
        standardHeaders: true,
        legacyHeaders: false,
    }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }), new sanitization_pipe_1.SanitizationPipe());
    const port = process.env.PORT || 3001;
    try {
        await app.listen(port);
        console.log(`Application is running on: ${await app.getUrl()}`);
    }
    catch (error) {
        if (error.code === 'EADDRINUSE') {
            const secondaryPort = process.env.SECONDARY_PORT || 3002;
            console.warn(`Port ${port} is in use, trying secondary port ${secondaryPort}...`);
            await app.listen(secondaryPort);
            console.log(`Application is running on: ${await app.getUrl()}`);
        }
        else {
            throw error;
        }
    }
}
bootstrap();
//# sourceMappingURL=main.js.map