import re

filepath = r'c:\Users\benja\OneDrive\Desktop\nutricion_app\frontend\src\app\dashboard\pacientes\[id]\PatientDetailClient.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

original_text = text

# Background blur decoration
text = re.sub(r'\s*<div className="absolute[^>]*blur-\[60px\][^>]*/>', '', text)

# Corners
text = re.sub(r'rounded-\[3rem\]', 'rounded-2xl', text)
text = re.sub(r'rounded-\[2\.5rem\]', 'rounded-2xl', text)
text = re.sub(r'rounded-4xl', 'rounded-2xl', text)
text = re.sub(r'rounded-3xl', 'rounded-2xl', text)

# Typography
text = text.replace('font-black', 'font-medium')
text = text.replace('tracking-tighter', '')
text = text.replace('italic', '')
text = text.replace('tracking-[0.2em]', '')
text = text.replace('tracking-widest', '')
text = text.replace('text-[10px]', 'text-xs')
text = text.replace('uppercase', '')
text = text.replace('text-4xl', 'text-2xl')

# Shadows
text = text.replace('shadow-2xl shadow-emerald-100', 'shadow-sm')
text = text.replace('shadow-2xl shadow-slate-300', 'shadow-sm')
text = text.replace('shadow-2xl', 'shadow-sm')
text = text.replace('shadow-xl shadow-slate-200/40', 'shadow-sm')

# Buttons and Colors
text = text.replace('bg-slate-900  text-white', 'bg-white border border-slate-200 text-slate-800')
text = text.replace('bg-slate-900', 'bg-white border text-slate-800')
text = text.replace('text-emerald-400', 'text-emerald-600')
text = text.replace('bg-white/5', 'bg-slate-100')
text = text.replace('border-white/10', 'border-slate-200')
text = text.replace('text-emerald-100', 'text-emerald-700')
text = text.replace('bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-14 px-10 rounded-2xl', 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10 px-4 rounded-xl')
text = text.replace('rounded-2xl h-14 px-8', 'rounded-xl h-10 px-4')
text = text.replace('h-14 px-10 rounded-2xl', 'h-10 px-4 rounded-xl')

# Clean double spaces
text = re.sub(r' {2,}', ' ', text)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)

print("Done. Text was modified:", original_text != text)
