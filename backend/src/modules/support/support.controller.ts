import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Delete } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('support')
export class SupportController {
    constructor(private readonly supportService: SupportService) { }

    // Public endpoint for submitting requests (Password Reset / Contact)
    @Post()
    create(@Body() body: CreateSupportRequestDto) {
        return this.supportService.create(body);
    }

    // Authenticated Feedback (uses JWT email)
    @UseGuards(AuthGuard('jwt'))
    @Post('feedback')
    createFeedback(@Request() req: any, @Body() body: import('./dto/create-feedback.dto').CreateFeedbackDto) {
        return this.supportService.create({
            ...body,
            email: req.user.email
        });
    }

    // Admin Only: List requests
    @UseGuards(AuthGuard('jwt'))
    @Get()
    findAll() {
        return this.supportService.findAll();
    }

    // Admin Only: Mark as resolved
    @UseGuards(AuthGuard('jwt'))
    @Patch(':id/resolve')
    resolve(@Param('id') id: string) {
        return this.supportService.resolve(id);
    }

    // Admin Only: Delete request
    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.supportService.remove(id);
    }
}
