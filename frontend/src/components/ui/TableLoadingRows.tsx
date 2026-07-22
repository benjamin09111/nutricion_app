interface TableLoadingRowsProps {
  rows?: number;
  columns?: number;
}

export function TableLoadingRows({ rows = 5, columns = 5 }: TableLoadingRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr
          key={rowIndex}
          className="animate-pulse border-b border-slate-50 last:border-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => {
            if (colIndex === 0) {
              return (
                <td key={colIndex} className="px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-slate-100 rounded" />
                      <div className="h-3 w-48 bg-slate-50 rounded" />
                    </div>
                  </div>
                </td>
              );
            }
            if (colIndex === 1) {
              return (
                <td key={colIndex} className="px-6 py-6">
                  <div className="h-4 w-24 bg-slate-100 rounded" />
                </td>
              );
            }
            if (colIndex === 2) {
              return (
                <td key={colIndex} className="px-6 py-6">
                  <div className="h-10 w-44 bg-slate-100 rounded-2xl" />
                </td>
              );
            }
            if (colIndex === 3) {
              return (
                <td key={colIndex} className="px-6 py-6">
                  <div className="h-6 w-20 bg-slate-100 rounded-full mx-auto" />
                </td>
              );
            }
            return (
              <td key={colIndex} className="px-6 py-6">
                <div className="h-8 w-8 bg-slate-100 rounded-lg ml-auto" />
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
