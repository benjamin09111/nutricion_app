import pdfplumber
import sys

def analyze_pdf_diet(filepath):
    print("=== EXTRACTING MEALS & RECIPES ===")
    with pdfplumber.open(filepath) as pdf:
        for i, page in enumerate(pdf.pages[10:35]):  # Look in the middle where meals usually are
            text = page.extract_text()
            if not text:
                continue
            
            # Print pages that might contain meal plans or lists
            lower_text = text.lower()
            if any(word in lower_text for word in ["desayuno", "almuerzo", "cena", "opción", "receta", "lista de compras", "porción"]):
                print(f"\n>>>> PAGE {i+11} (POTENTIAL MEAL PLAN/RECIPE):")
                print(text[:800])
                print("-" * 40)

if __name__ == "__main__":
    analyze_pdf_diet(sys.argv[1])
