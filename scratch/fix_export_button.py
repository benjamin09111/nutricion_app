import os

file_path = r"c:\Users\benja\OneDrive\Desktop\nutricion_app\frontend\src\app\dashboard\entregable\DeliverableClient.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Target strings to replace
target = "disabled={isExporting}"
replacement = "disabled={isExporting || !previousStagesSummary.diet.hasData || !previousStagesSummary.patient.hasData || !previousStagesSummary.recipes.hasData || !previousStagesSummary.cart.hasData}"

if target in content:
    new_content = content.replace(target, replacement)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully updated the file.")
else:
    print("Target string not found.")
