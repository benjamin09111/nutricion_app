import pdfplumber
import sys

def analyze_full_pdf(filepath):
    print("EXTRACTING METADATA...")
    with pdfplumber.open(filepath) as pdf:
        num_pages = len(pdf.pages)
        print(f"Total Pages: {num_pages}")
        
        # Analyze structure finding key sections
        print("\n=== KEY SECTIONS / FLOW ===")
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if not text:
                continue
                
            # Print the first line or two of each page acting as headers
            lines = [line.strip() for line in text.split('\n') if line.strip()]
            if lines:
                print(f"Page {i+1}: {lines[0]}")
                if len(lines) > 1 and len(lines[0]) < 20:
                    print(f"         {lines[1]}")

        # Look specifically at page 4-10 for the diet/meal structures
        print("\n=== DEEP DIVE INTO EXAMPLES (Pages 5-10) ===")
        for i, page in enumerate(pdf.pages[4:10]):
            text = page.extract_text()
            if text:
                print(f"\n--- Page {i+5} structure sample ---")
                print(text[:400])

if __name__ == "__main__":
    analyze_full_pdf(sys.argv[1])
