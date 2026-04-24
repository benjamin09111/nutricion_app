const fs = require('fs');
const path = "c:\\Users\\benja\\OneDrive\\Desktop\\nutricion_app\\frontend\\src\\app\\dashboard\\rapido\\QuickDeliverableClient.tsx";
let content = fs.readFileSync(path, 'utf8');

// 1. Add isExportDisabled memo
const memoLines = `  const isExportDisabled = useMemo(() => {
    const hasPatient = !!selectedPatient?.fullName?.trim();
    const hasAtLeastOneMeal = meals.some(m => m.mealText.trim().length > 0);
    const hasAtLeastOneAvoidFood = validAvoidFoods.length > 0;
    
    return !hasPatient || (!hasAtLeastOneMeal && !hasAtLeastOneAvoidFood);
  }, [selectedPatient, meals, validAvoidFoods]);`;

if (!content.includes('const isExportDisabled = useMemo')) {
    const insertPoint = content.indexOf('const portionGuideCount = useMemo');
    if (insertPoint !== -1) {
        content = content.slice(0, insertPoint) + memoLines + "\n\n  " + content.slice(insertPoint);
    }
}

// 2. Disable export-pdf in actionDockItems (Wait, this one doesn't have export-pdf in dock, it's in footer)
// Actually line 744 shows actionDockItems. Let's see.
/*
744:   const actionDockItems: ActionDockItem[] = [
...
*/
// It doesn't have export-pdf in the dock.

// 3. Disable the main export button in footer
const footerTarget = `onClick={handleExportPdf} disabled={isExportingPdf}`;
const footerReplacement = `onClick={handleExportPdf} disabled={isExportingPdf || isExportDisabled}`;

if (content.includes(footerTarget)) {
    content = content.split(footerTarget).join(footerReplacement);
}

// 4. Add visual warning in footer
const footerDivTarget = `<div className="flex items-center gap-3">`;
const footerDivReplacement = `<div className="flex flex-col sm:flex-row items-center gap-4">
              {isExportDisabled && (
                <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-bold animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Faltan datos fundamentales (Paciente + Contenido)</span>
                </div>
              )}`;

// We want the last occurrence (footer)
const lines = content.split('\n');
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes(footerDivTarget)) {
        lines[i] = lines[i].replace(footerDivTarget, footerDivReplacement);
        break;
    }
}

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log("Successfully updated QuickDeliverableClient.tsx");
