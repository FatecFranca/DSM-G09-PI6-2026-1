import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <label className="flex flex-col gap-1.5" htmlFor={inputId}>
      {label ? <span className="text-sm font-medium text-slate-300">{label}</span> : null}
      <input
        id={inputId}
        className={`rounded-xl border bg-surface-900/80 px-4 py-3 font-mono text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-accent/50 focus:ring-2 focus:ring-accent/20 ${
          error ? 'border-verdict-unsafe/50' : 'border-white/10'
        } ${className}`}
        {...props}
      />
      {error ? <span className="text-xs text-verdict-unsafe">{error}</span> : null}
      {hint && !error ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}
