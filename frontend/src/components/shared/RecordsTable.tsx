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
  rowClassName = "hover:bg-emerald-50/20 transition-colors group",
  footer,
}: RecordsTableProps<T>) {
  const colSpan = columns.length;

  return (
    <div className="bg-white shadow-xl shadow-slate-200/50 border border-slate-200/60 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.header}
                  scope="col"
                  className={`px-6 py-4 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-100 ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
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
                      className={`px-6 py-4 ${col.className ?? ""}`}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={colSpan} className="text-center py-24">
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
        <div className="bg-slate-50/50 p-4 border-t border-slate-100 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
}
