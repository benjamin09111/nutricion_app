import sys
import re

file_path = r'C:\Users\Benjamin\Desktop\nutricion_app\frontend\src\app\dashboard\pacientes\[id]\PatientDetailClient.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

def fix_tab_block(lines, pattern):
    for i, line in enumerate(lines):
        if pattern in line:
            stack = 0
            for j in range(i, len(lines)):
                # Count <div but not </div>
                opens = len(re.findall(r'<div(?:\s|>)', lines[j]))
                closes = lines[j].count('</div>')
                stack += opens
                stack -= closes
                if (')} ' in lines[j] or ')}' in lines[j]) and stack < 0:
                    print(f"Found overflow at line {j+1}: stack={stack}")
                    while stack < 0:
                        for k in range(j, i, -1):
                            if lines[k].strip() == '</div>':
                                print(f"Removing extra </div> at line {k+1}")
                                lines[k] = '\n' # Replace with newline to keep line numbers if possible
                                stack += 1
                                if stack == 0: break
                        if stack < 0: break
                    return True
    return False

fix_tab_block(lines, 'activeTab === "General" && (')
fix_tab_block(lines, 'activeTab === "Consultas" && (')

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
