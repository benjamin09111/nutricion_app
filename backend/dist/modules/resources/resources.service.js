"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourcesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ResourcesService = class ResourcesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    extractVariables(content) {
        const regex = /\^([a-zA-Z0-9_\- ]+)\^/g;
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
        return content.replace(/\^([a-zA-Z0-9_\- ]+)\^/g, (_full, key) => {
            const normalizedKey = key.trim();
            return safeInputs[normalizedKey] ?? `^${normalizedKey}^`;
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
};
exports.ResourcesService = ResourcesService;
exports.ResourcesService = ResourcesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ResourcesService);
//# sourceMappingURL=resources.service.js.map