const fs = require('fs');
const path = "c:\\Users\\benja\\OneDrive\\Desktop\\nutricion_app\\frontend\\src\\app\\dashboard\\rapido\\recetas\\QuickRecipesClient.tsx";
let content = fs.readFileSync(path, 'utf8');

const target = `id: "export-pdf",
      icon: Download,
      label: isExportingPdf ? "Exportando..." : "Exportar PDF",
      variant: "slate",
      onClick: handleExportPdf,`;

const replacement = `id: "export-pdf",
      icon: Download,
      label: isExportingPdf ? "Exportando..." : "Exportar PDF",
      variant: "slate",
      onClick: handleExportPdf,
      disabled: isExportingPdf || isExportDisabled,`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Successfully updated ActionDock export button in QuickRecipesClient.tsx");
} else {
    console.log("ActionDock export button target not found.");
}
