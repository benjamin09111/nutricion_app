import pdfplumber
import sys

def parse_meal_plan(filepath):
    print("=== EXTRACTING KEY PAGES (17-29) ===")
    with pdfplumber.open(filepath) as pdf:
        for i, page in enumerate(pdf.pages[16:29]):
            text = page.extract_text()
            if text:
                print(f"\n>>>> PAGE {i+17}:")
                print(text[:1000])
                print("-" * 60)

if __name__ == "__main__":
    parse_meal_plan(sys.argv[1])
