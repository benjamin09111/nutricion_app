import { forwardRef, TextareaHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
    extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    error && "border-red-300 text-red-900 focus-visible:ring-red-500 bg-red-50 placeholder:text-red-300",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }
