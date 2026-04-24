const fs = require('fs');
const path = "c:\\Users\\benja\\OneDrive\\Desktop\\nutricion_app\\frontend\\src\\app\\dashboard\\entregable\\DeliverableClient.tsx";
let content = fs.readFileSync(path, 'utf8');

const target = "disabled={isExporting}";
const replacement = "disabled={isExporting || !previousStagesSummary.diet.hasData || !previousStagesSummary.patient.hasData || !previousStagesSummary.recipes.hasData || !previousStagesSummary.cart.hasData}";

if (content.includes(target)) {
    const newContent = content.split(target).join(replacement);
    fs.writeFileSync(path, newContent, 'utf8');
    console.log("Successfully updated the file components.");
} else {
    console.log("Target string not found in file.");
}
