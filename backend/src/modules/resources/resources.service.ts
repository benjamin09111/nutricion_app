import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
const pdf = require('pdf-parse');
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  private extractVariables(content: string): string[] {
    const regex = /\{([a-zA-Z0-9_\- ]+)\}/g;
    const variables = new Set<string>();
    let match: RegExpExecArray | null = regex.exec(content);
    while (match) {
      variables.add(match[1].trim());
      match = regex.exec(content);
    }
    return Array.from(variables);
  }

  private enrichWithVariables<T extends { content: string }>(
    resource: T,
  ): T & { variablePlaceholders: string[] } {
    return {
      ...resource,
      variablePlaceholders: this.extractVariables(resource.content || ''),
    };
  }

  resolveVariables(content: string, inputs: Record<string, string>) {
    const safeInputs = inputs || {};
    return content.replace(
      /\{([a-zA-Z0-9_\- ]+)\}/g,
      (_full: string, key: string) => {
        const normalizedKey = key.trim();
        return safeInputs[normalizedKey] ?? `{${normalizedKey}}`;
      },
    );
  }

  async findAll(nutritionistId: string, isAdmin: boolean) {
    const resources = await this.prisma.resource.findMany({
      where: {
        OR: [
          { nutritionistId },
          { nutritionistId: null }, // Public/Default resources
          { isPublic: true },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });

    return resources.map((resource) =>
      this.enrichWithVariables({
        ...resource,
        isMine: resource.nutritionistId === nutritionistId,
      }),
    );
  }

  async findOne(id: string) {
    const resource = await this.prisma.resource.findUnique({
      where: { id },
    });
    if (!resource) return null;
    return this.enrichWithVariables(resource);
  }

  async create(
    nutritionistId: string | null,
    data: {
      title: string;
      content: string;
      category: string;
      tags?: string[];
      images?: any;
      isPublic?: boolean;
      sources?: string;
      format?: string;
      fileUrl?: string;
    },
  ) {
    const created = await this.prisma.resource.create({
      data: {
        ...data,
        nutritionistId,
      },
    });
    return this.enrichWithVariables(created);
  }

  async update(
    id: string,
    nutritionistId: string,
    isAdmin: boolean,
    data: {
      title?: string;
      content?: string;
      category?: string;
      tags?: string[];
      images?: any;
      isPublic?: boolean;
      sources?: string;
      format?: string;
      fileUrl?: string;
    },
  ) {
    // Check ownership (admins can edit anything, but usually they edit global ones)
    const resource = await this.prisma.resource.findUnique({ where: { id } });
    if (!resource) throw new Error('Resource not found');

    if (!isAdmin && resource.nutritionistId !== nutritionistId) {
      throw new Error('Unauthorized');
    }

    const updated = await this.prisma.resource.update({
      where: { id },
      data,
    });
    return this.enrichWithVariables(updated);
  }

  async remove(id: string, nutritionistId: string, isAdmin: boolean) {
    const resource = await this.prisma.resource.findUnique({ where: { id } });
    if (!resource) throw new Error('Resource not found');

    if (!isAdmin && resource.nutritionistId !== nutritionistId) {
      throw new Error('Unauthorized');
    }

    return this.prisma.resource.delete({
      where: { id },
    });
  }

  async getSections(nutritionistId: string) {
    return this.prisma.resourceSection.findMany({
      where: {
        OR: [
          { nutritionistId },
          { nutritionistId: null }, // System defaults
        ],
      },
      orderBy: { name: 'asc' },
    });
  }

  async createSection(
    nutritionistId: string | null,
    data: { name: string; icon?: string; color?: string; bg?: string },
  ) {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check if exists
    const existing = await this.prisma.resourceSection.findFirst({
      where: {
        OR: [{ slug }, { name: data.name }],
      },
    });

    if (existing) {
      return existing; // Return existing if already there
    }

    return this.prisma.resourceSection.create({
      data: {
        ...data,
        slug,
        nutritionistId,
      },
    });
  }

  async extractTextFromPdf(fileUrl: string) {
    try {
      // Find filename from URL
      const fileName = fileUrl.split('/').pop();
      if (!fileName) throw new Error('Nombre de archivo inválido');

      const filePath = join(process.cwd(), 'uploads', fileName);
      if (!fs.existsSync(filePath)) {
        throw new Error('El archivo no se encuentra en el servidor');
      }

      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);

      // Clean text
      const cleanText = data.text
        .replace(/\r/g, '')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

      const htmlContent =
        `<h1>Contenido Digitalizado</h1>` +
        cleanText
          .split('\n\n')
          .map((p: string) => {
            const cleanP = p.trim().replace(/\n/g, '<br/>');
            return cleanP ? `<p>${cleanP}</p>` : '';
          })
          .join('');

      return {
        text: cleanText,
        html: htmlContent,
        pages: data.numpages,
        info: data.info,
      };
    } catch (error) {
      console.error('Error in PDF extraction:', error);
      throw new Error(`Error al digitalizar el PDF: ${error.message}`);
    }
  }
}
