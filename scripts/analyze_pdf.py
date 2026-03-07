import pdfplumber
import sys

def extract_pdf_info(filepath):
    print(f"--- ANALYZING PDF: {filepath} ---")
    with pdfplumber.open(filepath) as pdf:
        print(f"Total Pages: {len(pdf.pages)}")
        
        # Analyze first 3 pages
        for i, page in enumerate(pdf.pages[:3]):
            print(f"\n--- PAGE {i+1} ---")
            text = page.extract_text()
            print("TEXT PREVIEW (first 500 chars):")
            print(text[:500] if text else "No text extracted")
            
            tables = page.extract_tables()
            if tables:
                print(f"\nFOUND {len(tables)} TABLES:")
                for j, table in enumerate(tables):
                    print(f"  Table {j+1} structure (rows x cols): {len(table)} x {len(table[0]) if table else 0}")
                    # Print first row as headers
                    if table and table[0]:
                        print(f"  Headers: {table[0][:3]}...")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        extract_pdf_info(sys.argv[1])
    else:
        print("Please provide a PDF file path")
