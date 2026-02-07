"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoodsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const XLSX = __importStar(require("xlsx"));
let FoodsService = class FoodsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createFoodDto, nutritionistId) {
        const isPublic = createFoodDto.isPublic ?? false;
        return this.prisma.food.create({
            data: {
                ...createFoodDto,
                nutritionistId: isPublic ? null : nutritionistId,
                isPublic: isPublic,
            },
        });
    }
    async findAll(params) {
        const { nutritionistId, search, category, page = 1, limit = 20 } = params;
        const whereClause = {
            OR: [{ isPublic: true }],
        };
        if (nutritionistId) {
            whereClause.OR.push({ nutritionistId });
        }
        if (search) {
            whereClause.name = { contains: search, mode: 'insensitive' };
        }
        if (category) {
            whereClause.category = category;
        }
        const foods = await this.prisma.food.findMany({
            where: {
                ...whereClause,
                ...(nutritionistId ? {
                    preferences: {
                        none: {
                            nutritionistId,
                            isHidden: true
                        }
                    }
                } : {})
            },
            include: nutritionistId
                ? {
                    preferences: {
                        where: { nutritionistId },
                    },
                }
                : undefined,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { name: 'asc' },
        });
        return foods;
    }
    async findOne(id) {
        return this.prisma.food.findUnique({
            where: { id },
        });
    }
    update(id, updateFoodDto) {
        return this.prisma.food.update({
            where: { id },
            data: updateFoodDto,
        });
    }
    remove(id) {
        return this.prisma.food.delete({
            where: { id },
        });
    }
    async getMarketPrices(limit = 7) {
        try {
            const filePath = path.resolve(process.cwd(), '..', 'docs', 'data', 'foods.csv');
            if (!fs.existsSync(filePath)) {
                console.error('Market prices file not found at:', filePath);
                return [];
            }
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                range: 0,
                header: 1,
                defval: ''
            });
            const headers = jsonData[0];
            const rows = jsonData.slice(1, limit + 1);
            return rows.map(row => {
                const record = {};
                headers.forEach((header, index) => {
                    const value = row[index];
                    record[header] = value;
                });
                return {
                    anio: record['Anio'],
                    mes: record['Mes'],
                    semana: record['Semana'],
                    fechaInicio: record['Fecha inicio'],
                    fechaTermino: record['Fecha termino'],
                    region: record['Region'],
                    sector: record['Sector'],
                    tipoPuntoMonitoreo: record['Tipo de punto monitoreo'],
                    grupo: record['Grupo'],
                    producto: record['Producto'],
                    unidad: record['Unidad'],
                    precioMinimo: parseFloat(record['Precio minimo']) || 0,
                    precioMaximo: parseFloat(record['Precio maximo']) || 0,
                    precioPromedio: parseFloat(String(record['Precio promedio']).replace(',', '.')) || 0,
                };
            });
        }
        catch (error) {
            console.error('Error reading market prices:', error);
            return [];
        }
    }
};
exports.FoodsService = FoodsService;
exports.FoodsService = FoodsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FoodsService);
//# sourceMappingURL=foods.service.js.map