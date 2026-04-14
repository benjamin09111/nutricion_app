
import sys

file_path = r'c:\Users\Benjamin\Desktop\nutricion_app\frontend\src\app\dashboard\recetas\RecipesClient.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix link-patient item
for i, line in enumerate(lines):
    if 'id: "link-patient-test",' in line:
        lines[i] = '        !selectedPatient && {\n'
        lines[i+1] = '          id: "link-patient",\n'
        lines[i+2] = '          icon: User,\n'
        lines[i+3] = '          label: "Importar Paciente",\n'
        break

# Add filter(Boolean)
for i, line in enumerate(lines):
    if '    ],' in line and i > 2300 and i < 2500:
        if i + 1 < len(lines) and '    [aiFillScope' in lines[i+1]:
            lines[i] = '      ].filter(Boolean) as ActionDockItem[],\n'
            break

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
