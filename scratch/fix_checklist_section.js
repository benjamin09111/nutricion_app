const fs = require('fs');
const path = "c:\\Users\\benja\\OneDrive\\Desktop\\nutricion_app\\frontend\\src\\app\\dashboard\\entregable\\DeliverableClient.tsx";
let content = fs.readFileSync(path, 'utf8');

const target = `<h3 className="mt-1 text-sm font-black uppercase tracking-widest text-slate-900">\n              Módulos previos requeridos\n            </h3>`;
const replacement = `<h3 className="mt-1 text-sm font-black uppercase tracking-widest text-slate-900">\n              Módulos obligatorios para exportación\n            </h3>\n            {isExportDisabled && (\n              <p className="mt-2 text-xs font-bold text-rose-600 flex items-center gap-2 animate-in fade-in slide-in-from-left duration-500">\n                <AlertCircle className="h-4 w-4" />\n                Debes completar todos los módulos marcados en rojo para habilitar la descarga del PDF.\n              </p>\n            )}`;

if (content.includes("Módulos previos requeridos")) {
    const lines = content.split('\n');
    const index = lines.findIndex(line => line.includes("Módulos previos requeridos"));
    if (index !== -1) {
        lines[index] = `              Módulos obligatorios para exportación`;
        lines.splice(index + 2, 0, `            {isExportDisabled && (`, `              <p className="mt-2 text-xs font-bold text-rose-600 flex items-center gap-2 animate-in fade-in slide-in-from-left duration-500">`, `                <AlertCircle className="h-4 w-4" />`, `                Debes completar todos los módulos marcados en rojo para habilitar la descarga del PDF.`, `              </p>`, `            )}`);
        fs.writeFileSync(path, lines.join('\n'), 'utf8');
        console.log("Successfully updated the checklist section.");
    }
} else {
    console.log("Target string not found for checklist section.");
}
