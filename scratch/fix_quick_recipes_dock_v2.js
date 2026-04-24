const fs = require('fs');
const path = "c:\\Users\\benja\\OneDrive\\Desktop\\nutricion_app\\frontend\\src\\app\\dashboard\\rapido\\recetas\\QuickRecipesClient.tsx";
let content = fs.readFileSync(path, 'utf8');

const target = `id: "export-pdf"`;
const lines = content.split('\n');
let found = false;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('id: "export-pdf"') && lines[i+4] && lines[i+4].includes('onClick: handleExportPdf')) {
        lines[i+4] = lines[i+4] + '\n      disabled: isExportingPdf || isExportDisabled,';
        found = true;
        break;
    }
}

if (found) {
    fs.writeFileSync(path, lines.join('\n'), 'utf8');
    console.log("Successfully updated ActionDock export button (line by line).");
} else {
    console.log("Could not find the export-pdf block manually.");
}
