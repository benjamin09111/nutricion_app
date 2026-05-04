"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeFoodName = normalizeFoodName;
function normalizeFoodName(name) {
    if (!name)
        return '';
    let normalized = name.toLowerCase();
    normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    normalized = normalized.replace(/\s*\([^)]*\)/g, '');
    normalized = normalized.replace(/\s*\[[^\]]*\]/g, '');
    normalized = normalized.replace(/\s*\{[^}]*\}/g, '');
    normalized = normalized.replace(/\s+/g, ' ').trim();
    return normalized;
}
//# sourceMappingURL=string.util.js.map