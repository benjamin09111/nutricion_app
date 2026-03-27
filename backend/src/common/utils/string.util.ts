export function normalizeFoodName(name: string): string {
    if (!name) return '';
    let normalized = name.toLowerCase();
    
    // Remove diacritics
    normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Remove contents in (), [], {} and after commas
    normalized = normalized.replace(/\s*\([^)]*\)/g, '');
    normalized = normalized.replace(/\s*\[[^\]]*\]/g, '');
    normalized = normalized.replace(/\s*\{[^}]*\}/g, '');
    
    // Sometimes formats have a comma followed by description "Arroz blanco, crudo" -> maybe keep first part?
    // Let's rely on parentheses for now as USDA/INTA uses that.
    
    // Remove extra spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
}
