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
exports.ResourcesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pdf = require('pdf-parse');
const fs = __importStar(require("fs"));
const path_1 = require("path");
let ResourcesService = class ResourcesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    extractVariables(content) {
        const regex = /\{([a-zA-Z0-9_\- ]+)\}/g;
        const variables = new Set();
        let match = regex.exec(content);
        while (match) {
            variables.add(match[1].trim());
            match = regex.exec(content);
        }
        return Array.from(variables);
    }
    enrichWithVariables(resource) {
        return {
            ...resource,
            variablePlaceholders: this.extractVariables(resource.content || ''),
        };
    }
    resolveVariables(content, inputs) {
        const safeInputs = inputs || {};
        return content.replace(/\{([a-zA-Z0-9_\- ]+)\}/g, (_full, key) => {
            const normalizedKey = key.trim();
            return safeInputs[normalizedKey] ?? `{${normalizedKey}}`;
        });
    }
    async findAll(nutritionistId, isAdmin) {
        const resources = await this.prisma.resource.findMany({
            where: {
                OR: [
                    { nutritionistId },
                    { nutritionistId: null },
                    { isPublic: true },
                ],
            },
            orderBy: { updatedAt: 'desc' },
        });
        return resources.map(resource => this.enrichWithVariables({
            ...resource,
            isMine: resource.nutritionistId === nutritionistId
        }));
    }
    async findOne(id) {
        const resource = await this.prisma.resource.findUnique({
            where: { id },
        });
        if (!resource)
            return null;
        return this.enrichWithVariables(resource);
    }
    async create(nutritionistId, data) {
        const created = await this.prisma.resource.create({
            data: {
                ...data,
                nutritionistId,
            },
        });
        return this.enrichWithVariables(created);
    }
    async update(id, nutritionistId, isAdmin, data) {
        const resource = await this.prisma.resource.findUnique({ where: { id } });
        if (!resource)
            throw new Error('Resource not found');
        if (!isAdmin && resource.nutritionistId !== nutritionistId) {
            throw new Error('Unauthorized');
        }
        const updated = await this.prisma.resource.update({
            where: { id },
            data,
        });
        return this.enrichWithVariables(updated);
    }
    async remove(id, nutritionistId, isAdmin) {
        const resource = await this.prisma.resource.findUnique({ where: { id } });
        if (!resource)
            throw new Error('Resource not found');
        if (!isAdmin && resource.nutritionistId !== nutritionistId) {
            throw new Error('Unauthorized');
        }
        return this.prisma.resource.delete({
            where: { id },
        });
    }
    async getSections(nutritionistId) {
        return this.prisma.resourceSection.findMany({
            where: {
                OR: [
                    { nutritionistId },
                    { nutritionistId: null },
                ],
            },
            orderBy: { name: 'asc' },
        });
    }
    async createSection(nutritionistId, data) {
        const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const existing = await this.prisma.resourceSection.findFirst({
            where: {
                OR: [
                    { slug },
                    { name: data.name }
                ]
            }
        });
        if (existing) {
            return existing;
        }
        return this.prisma.resourceSection.create({
            data: {
                ...data,
                slug,
                nutritionistId,
            },
        });
    }
    async extractTextFromPdf(fileUrl) {
        try {
            const fileName = fileUrl.split('/').pop();
            if (!fileName)
                throw new Error('Nombre de archivo inválido');
            const filePath = (0, path_1.join)(process.cwd(), 'uploads', fileName);
            if (!fs.existsSync(filePath)) {
                throw new Error('El archivo no se encuentra en el servidor');
            }
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            let cleanText = data.text
                .replace(/\r/g, '')
                .replace(/\n\s*\n/g, '\n\n')
                .trim();
            const htmlContent = `<h1>Contenido Digitalizado</h1>` +
                cleanText.split('\n\n').map((p) => {
                    const cleanP = p.trim().replace(/\n/g, '<br/>');
                    return cleanP ? `<p>${cleanP}</p>` : '';
                }).join('');
            return {
                text: cleanText,
                html: htmlContent,
                pages: data.numpages,
                info: data.info
            };
        }
        catch (error) {
            console.error('Error in PDF extraction:', error);
            throw new Error(`Error al digitalizar el PDF: ${error.message}`);
        }
    }
};
exports.ResourcesService = ResourcesService;
exports.ResourcesService = ResourcesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResourcesService);
//# sourceMappingURL=resources.service.js.map