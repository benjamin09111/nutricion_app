import React from "react";
import { TableLoadingRows } from "@/components/ui/TableLoadingRows";

export interface Column<T> {
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
}

interface RecordsTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  loadingRows?: number;
  loadingColumns?: number;
  emptyState?: React.ReactNode;
  onRowClick?: (item: T) => void;
  rowClassName?: string;
  footer?: React.ReactNode;
}

export function RecordsTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  loadingRows = 5,
  loadingColumns = 5,
  emptyState,
  onRowClick,
  rowClassName = "hover:bg-slate-50/60 transition-colors group",
  footer,
}: RecordsTableProps<T>) {
  const colSpan = columns.length;

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-200/80">
              {columns.map((col) => (
                <th
                  key={col.header}
                  scope="col"
                  className={`py-3 px-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <TableLoadingRows rows={loadingRows} columns={loadingColumns} />
            ) : data.length > 0 ? (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  className={`${rowClassName} ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.header}
                      className={`py-3.5 px-4 ${col.className ?? ""}`}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={colSpan} className="text-center py-20">
                  {emptyState ?? (
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <p className="text-sm font-semibold text-slate-500">
                        Sin resultados
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {footer && (
        <div className="pt-4 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}
