import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class SanitizationPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        if (!value) {
            return value;
        }

        if (typeof value === 'string') {
            return this.sanitize(value);
        }

        if (typeof value === 'object') {
            return this.sanitizeObject(value);
        }

        return value;
    }

    private sanitizeObject(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(v => {
                if (typeof v === 'string') return this.sanitize(v);
                if (typeof v === 'object' && v !== null) return this.sanitizeObject(v);
                return v;
            });
        }

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'string') {
                    obj[key] = this.sanitize(obj[key]);
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    obj[key] = this.sanitizeObject(obj[key]);
                }
            }
        }
        return obj;
    }

    private sanitize(str: string): string {
        // Basic Custom Sanitization to remove dangerous tags and attributes
        // Strategy: Whitelist driven is hard without library. Blacklist driven:
        // 1. Remove <script> tags and content
        let clean = str.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");

        // 2. Remove event handlers like onclick, onload, etc.
        clean = clean.replace(/ on\w+="[^"]*"/gim, "");

        // 3. Remove javascript: protocol
        clean = clean.replace(/javascript:/gim, "");

        // 4. Remove basic HTML tags if strictly needed (optional, here we prevent scripts)
        // For specific fields we might want HTML (like rich text), but for general inputs:
        // We strip tags to be safe. "Strict Mode". 
        // If we want to allow some HTML, we'd need a parser.
        // For now, let's strip < > to html entities to neutralize them as code.
        // Actually, simply neutralizing < and > is the safest "text-only" approach.

        clean = clean
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        return clean;
    }
}
