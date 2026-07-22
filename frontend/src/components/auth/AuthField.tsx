import { AlertCircle } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { Input } from "@/components/ui/Input";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, error, id, className = "", ...props }, ref) => (
    <div>
      {label ? (
        <label
          htmlFor={id}
          className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"
        >
          {label}
        </label>
      ) : null}
      <Input
        ref={ref}
        id={id}
        error={error}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-10 rounded-xl border-slate-200 bg-white px-3 text-sm shadow-sm ${className}`}
        {...props}
      />
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  ),
);

AuthField.displayName = "AuthField";

export default AuthField;
