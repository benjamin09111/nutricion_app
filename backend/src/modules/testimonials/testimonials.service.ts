import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(private readonly prisma: PrismaService) {}

  // Public endpoint: published testimonials
  async findPublic() {
    return this.prisma.testimonial.findMany({
      where: { isPublished: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  // Admin: get unreviewed count
  async getUnreviewedCount() {
    const count = await this.prisma.testimonial.count({
      where: { isReviewed: false },
    });
    return { count };
  }

  // Admin: list all testimonials
  async findAllAdmin() {
    return this.prisma.testimonial.findMany({
      orderBy: [{ isReviewed: 'asc' }, { createdAt: 'desc' }],
    });
  }

  // Admin: find one
  async findOne(id: string) {
    const item = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Testimonio no encontrado');
    return item;
  }

  // Admin: create manual testimonial
  async create(dto: CreateTestimonialDto) {
    const avatarText = dto.avatarText || this.generateAvatarText(dto.name);
    return this.prisma.testimonial.create({
      data: {
        ...dto,
        avatarText,
        isReviewed: dto.isReviewed ?? true,
      },
    });
  }

  // Auto-create from Support/Feedback request of type TESTIMONIO
  async createFromSupportRequest(data: {
    supportRequestId: string;
    name: string;
    quote: string;
    email?: string;
  }) {
    const avatarText = this.generateAvatarText(data.name);
    return this.prisma.testimonial.create({
      data: {
        name: data.name,
        quote: data.quote,
        avatarText,
        isPublished: false,
        isReviewed: false,
        supportRequestId: data.supportRequestId,
      },
    });
  }

  // Admin: update testimonial
  async update(id: string, dto: UpdateTestimonialDto) {
    await this.findOne(id);
    return this.prisma.testimonial.update({
      where: { id },
      data: dto,
    });
  }

  // Admin: toggle publish status
  async togglePublish(id: string) {
    const item = await this.findOne(id);
    return this.prisma.testimonial.update({
      where: { id },
      data: {
        isPublished: !item.isPublished,
        isReviewed: true, // Mark reviewed when publishing
      },
    });
  }

  // Admin: mark as reviewed
  async markAsReviewed(id: string) {
    await this.findOne(id);
    return this.prisma.testimonial.update({
      where: { id },
      data: { isReviewed: true },
    });
  }

  // Admin: delete testimonial
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.testimonial.delete({ where: { id } });
  }

  private generateAvatarText(name: string): string {
    if (!name) return 'TN';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
