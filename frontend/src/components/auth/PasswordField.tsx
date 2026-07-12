"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import AuthField from "./AuthField";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
};

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div>
        <label
          htmlFor={id}
          className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500"
        >
          {label}
        </label>
        <div className="relative">
          <AuthField
            ref={ref}
            id={id}
            label="" // Clear label inside AuthField to prevent duplicate label rendering
            type={visible ? "text" : "password"}
            error={error}
            className="pr-11 w-full"
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {visible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>
    );
  },
);

PasswordField.displayName = "PasswordField";

export default PasswordField;

