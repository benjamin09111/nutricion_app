const fs = require('fs');
const path = "c:\\Users\\benja\\OneDrive\\Desktop\\nutricion_app\\frontend\\src\\app\\dashboard\\entregable\\DeliverableClient.tsx";
let content = fs.readFileSync(path, 'utf8');

const target = `<div className="flex items-center gap-3">`;
const replacement = `<div className="flex flex-col sm:flex-row items-center gap-4">
              {isExportDisabled && (
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  <span>Faltan completar etapas obligatorias</span>
                </div>
              )}`;

if (content.includes(target)) {
    const lines = content.split('\n');
    // We want the ONE in the footer, which is near the end
    for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].includes(target)) {
            lines[i] = lines[i].replace(target, replacement);
            break;
        }
    }
    fs.writeFileSync(path, lines.join('\n'), 'utf8');
    console.log("Successfully updated the footer section.");
} else {
    console.log("Target string not found for footer section.");
}
