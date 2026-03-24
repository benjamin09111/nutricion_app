"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanitizationPipe = void 0;
const common_1 = require("@nestjs/common");
let SanitizationPipe = class SanitizationPipe {
    transform(value, metadata) {
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
    sanitizeObject(obj) {
        if (Array.isArray(obj)) {
            return obj.map(v => {
                if (typeof v === 'string')
                    return this.sanitize(v);
                if (typeof v === 'object' && v !== null)
                    return this.sanitizeObject(v);
                return v;
            });
        }
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'string') {
                    obj[key] = this.sanitize(obj[key]);
                }
                else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    obj[key] = this.sanitizeObject(obj[key]);
                }
            }
        }
        return obj;
    }
    sanitize(str) {
        let clean = str.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
        clean = clean.replace(/ on\w+="[^"]*"/gim, "");
        clean = clean.replace(/javascript:/gim, "");
        clean = clean
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        return clean;
    }
};
exports.SanitizationPipe = SanitizationPipe;
exports.SanitizationPipe = SanitizationPipe = __decorate([
    (0, common_1.Injectable)()
], SanitizationPipe);
//# sourceMappingURL=sanitization.pipe.js.map