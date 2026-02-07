import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/Button'; // Adjusted import path just in case
import { cn } from '@/lib/utils';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
    // Generate page numbers to display
    const getPageNumbers = () => {
        const delta = 1; // Number of pages to show on each side of current
        const range: (number | string)[] = [];

        // Always show 1
        // Show current - delta to current + delta
        // Always show last

        const rangeMembers: number[] = [];
        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            rangeMembers.push(i);
        }

        if (currentPage - delta > 2) {
            range.push(1);
            range.push('...');
        } else {
            range.push(1);
        }

        rangeMembers.forEach(p => range.push(p));

        if (currentPage + delta < totalPages - 1) {
            range.push('...');
            range.push(totalPages);
        } else if (totalPages > 1) {
            range.push(totalPages);
        }

        // Clean up duplicates if any logic slipped (though logic above tries to avoid it) - actually the above logic is a bit complex to get right 100% without duplicates if ranges overlap.
        // Let's use a simpler verified algorithm.

        const visiblePages: (number | string)[] = [];

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) visiblePages.push(i);
            return visiblePages;
        }

        // 1, 2, 3, 4, 5, ..., 20
        // 1, ..., 10, 11, 12, ..., 20

        if (currentPage <= 4) {
            for (let i = 1; i <= 5; i++) visiblePages.push(i);
            visiblePages.push('...');
            visiblePages.push(totalPages);
        } else if (currentPage >= totalPages - 3) {
            visiblePages.push(1);
            visiblePages.push('...');
            for (let i = totalPages - 4; i <= totalPages; i++) visiblePages.push(i);
        } else {
            visiblePages.push(1);
            visiblePages.push('...');
            visiblePages.push(currentPage - 1);
            visiblePages.push(currentPage);
            visiblePages.push(currentPage + 1);
            visiblePages.push('...');
            visiblePages.push(totalPages);
        }

        return visiblePages;
    };

    if (totalPages <= 1) return null;

    const pages = getPageNumbers();

    return (
        <div className={cn("flex items-center justify-center space-x-2 py-4", className)}>
            <div className="flex items-center space-x-1">
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    title="Primera página"
                >
                    <span className="sr-only">Primera</span>
                    <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    title="Anterior"
                >
                    <span className="sr-only">Anterior</span>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex items-center space-x-1">
                {pages.map((page, index) => (
                    typeof page === 'number' ? (
                        <Button
                            key={`${page}-${index}`}
                            variant={currentPage === page ? "default" : "ghost"}
                            className={cn(
                                "h-8 w-8 p-0 font-bold transition-all text-xs rounded-lg",
                                currentPage === page
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            )}
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </Button>
                    ) : (
                        <span key={`ellipsis-${index}`} className="px-1 text-slate-300 text-xs font-bold select-none">...</span>
                    )
                ))}
            </div>

            <div className="flex items-center space-x-1">
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    title="Siguiente"
                >
                    <span className="sr-only">Siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Última página"
                >
                    <span className="sr-only">Última</span>
                    <ChevronsRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
