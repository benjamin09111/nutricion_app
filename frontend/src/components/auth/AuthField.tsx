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
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500"
      >
        {label}
      </label>
      <Input
        ref={ref}
        id={id}
        error={error}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-12 rounded-2xl border-slate-200 bg-white px-4 text-base shadow-sm ${className}`}
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
