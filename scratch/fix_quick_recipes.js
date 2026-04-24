const fs = require('fs');
const path = "c:\\Users\\benja\\OneDrive\\Desktop\\nutricion_app\\frontend\\src\\app\\dashboard\\rapido\\recetas\\QuickRecipesClient.tsx";
let content = fs.readFileSync(path, 'utf8');

// 1. Add memos
const memoLines = `  const isGenerationDisabled = useMemo(() => {
    // Fundamental: patient or at least manual instructions
    const hasPatient = !!selectedPatient;
    const hasInstructions = !!allowedFoodsMainText.trim() || !!nutritionistNotes.trim();
    return !hasPatient && !hasInstructions;
  }, [selectedPatient, allowedFoodsMainText, nutritionistNotes]);

  const isExportDisabled = useMemo(() => {
    const hasPatient = !!selectedPatient;
    const hasAtLeastOneDish = dishes.some(d => d.title.trim().length > 0);
    return !hasPatient || !hasAtLeastOneDish;
  }, [selectedPatient, dishes]);`;

if (!content.includes('const isGenerationDisabled = useMemo')) {
    const insertPoint = content.indexOf('const [isPatientModalOpen');
    if (insertPoint !== -1) {
        content = content.slice(0, insertPoint) + memoLines + "\n\n  " + content.slice(insertPoint);
    }
}

// 2. Disable IA buttons
content = content.replace(
    'onClick={() => generateWithAi("single")}\n                  disabled={isGenerating || isGeneratingWeekly}',
    'onClick={() => generateWithAi("single")}\n                  disabled={isGenerating || isGeneratingWeekly || isGenerationDisabled}'
);
content = content.replace(
    'onClick={() => generateWithAi("weekly")}\n                  disabled={isGenerating || isGeneratingWeekly}',
    'onClick={() => generateWithAi("weekly")}\n                  disabled={isGenerating || isGeneratingWeekly || isGenerationDisabled}'
);

// 3. Disable export button in footer
content = content.replace(
    'onClick={handleExportPdf}\n                disabled={isExportingPdf}',
    'onClick={handleExportPdf}\n                disabled={isExportingPdf || isExportDisabled}'
);

// 4. Add visual warning in footer
const footerDivTarget = `<div className="flex items-center gap-3">`;
const footerDivReplacement = `<div className="flex flex-col sm:flex-row items-center gap-4">
              {isExportDisabled && (
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-bold animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Faltan datos fundamentales (Paciente + Platos)</span>
                </div>
              )}`;

const lines = content.split('\n');
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes(footerDivTarget)) {
        lines[i] = lines[i].replace(footerDivTarget, footerDivReplacement);
        break;
    }
}

// 5. Add visual warning in IA section
const iaHeaderTarget = `<h3 className="text-sm font-black uppercase tracking-widest text-indigo-700">`;
const iaHeaderReplacement = `<h3 className="text-sm font-black uppercase tracking-widest text-indigo-700">
                  Generar con IA segun instrucciones
                </h3>
                {isGenerationDisabled && (
                  <p className="mt-1 text-[10px] font-bold text-rose-600 animate-pulse">
                    ⚠️ Selecciona un paciente o ingresa instrucciones para habilitar la IA
                  </p>
                )}`;

// Replace just the first one if possible
content = lines.join('\n');
if (content.includes('Generar con IA segun instrucciones</h3>')) {
    // Standard react might have </h3> on same line
    content = content.replace(
        '<h3 className="text-sm font-black uppercase tracking-widest text-indigo-700">\n                  Generar con IA segun instrucciones\n                </h3>',
        iaHeaderReplacement
    );
}

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully updated QuickRecipesClient.tsx");
