import ExcelJS from "exceljs";

/**
 * Thin adapter over ExcelJS that keeps the array-of-rows shape the Excel
 * exports were already written against, so migrating away from `xlsx` (which
 * has unpatched prototype-pollution and ReDoS advisories and no fix on npm)
 * did not require rewriting every export.
 */

/** Column width, in characters — same unit `xlsx` used for `!cols`. */
export type ColumnWidth = { wch: number };

/** Zero-based inclusive merge range, matching the old `!merges` shape. */
export type MergeRange = {
  s: { r: number; c: number };
  e: { r: number; c: number };
};

/**
 * Rows may carry the old cell descriptors (`{ v: "text", ... }`) instead of raw
 * values; only the value survives, which matches what the community build of
 * `xlsx` actually wrote (its styling fields were a no-op).
 */
type CellInput = unknown;

const toCellValue = (cell: CellInput) => {
  if (cell && typeof cell === "object" && "v" in (cell as Record<string, unknown>)) {
    return (cell as { v: unknown }).v as ExcelJS.CellValue;
  }
  return cell as ExcelJS.CellValue;
};

export const createWorkbook = () => new ExcelJS.Workbook();

export function addSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: CellInput[][],
  options: { cols?: ColumnWidth[]; merges?: MergeRange[] } = {},
) {
  const sheet = workbook.addWorksheet(name);

  sheet.addRows(rows.map((row) => row.map(toCellValue)));

  if (options.cols?.length) {
    sheet.columns = options.cols.map((col) => ({ width: col.wch }));
  }

  for (const merge of options.merges ?? []) {
    // `xlsx` merge ranges are zero-based; ExcelJS rows/columns start at 1.
    sheet.mergeCells(
      merge.s.r + 1,
      merge.s.c + 1,
      merge.e.r + 1,
      merge.e.c + 1,
    );
  }

  return sheet;
}

export async function workbookToBlob(workbook: ExcelJS.Workbook) {
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/** Browser-side replacement for `XLSX.writeFile`. */
export async function downloadWorkbook(
  workbook: ExcelJS.Workbook,
  filename: string,
) {
  const blob = await workbookToBlob(workbook);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
