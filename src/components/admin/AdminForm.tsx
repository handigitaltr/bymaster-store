"use client";

import { createContext, useContext, useEffect, useId, useRef } from "react";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { AdminFormState } from "@/lib/admin-form";
import { useActionForm } from "@/lib/use-action-form";
import { cx } from "@/lib/utils";

const ErrorsContext = createContext<Record<string, string[] | undefined>>({});

/**
 * Yönetim formları için ortak sarmalayıcı: sunucu eylemini çağırır, genel mesajı ve alan hatalarını gösterir.
 * Alan bileşenleri (AField, ASelect, ...) hatalarını bağlamdan okur.
 */
export function AdminForm({
  action,
  children,
  submitLabel = "Kaydet",
  className,
  resetOnSuccess = false,
  hideSubmit = false,
  submitVariant = "btn-primary",
}: {
  action: (state: AdminFormState, formData: FormData) => Promise<AdminFormState>;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
  resetOnSuccess?: boolean;
  hideSubmit?: boolean;
  submitVariant?: string;
}) {
  const { state, formAction, onSubmit } = useActionForm<AdminFormState>(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <ErrorsContext.Provider value={state?.errors ?? {}}>
      <form ref={ref} action={formAction} onSubmit={onSubmit} className={cx("space-y-5", className)} noValidate>
        {state?.message ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
        {children}
        {hideSubmit ? null : (
          <SubmitButton variant={submitVariant} pendingLabel="Kaydediliyor…">
            {submitLabel}
          </SubmitButton>
        )}
      </form>
    </ErrorsContext.Provider>
  );
}

function useFieldError(name: string) {
  return useContext(ErrorsContext)[name]?.[0];
}

type Common = { name: string; label: string; hint?: React.ReactNode; className?: string };

export function AField({ name, label, hint, className, ...input }: Common & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input id={id} name={name} className="field-input" aria-invalid={error ? true : undefined} {...input} />
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function ATextArea({ name, label, hint, className, ...input }: Common & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <textarea id={id} name={name} className="field-input" aria-invalid={error ? true : undefined} {...input} />
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function ASelect({
  name,
  label,
  hint,
  className,
  options,
  ...select
}: Common & { options: Array<{ value: string; label: string }> } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name">) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <select id={id} name={name} className="field-input" aria-invalid={error ? true : undefined} {...select}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function ACheckbox({ name, label, hint, className, ...input }: Common & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "type">) {
  const id = useId();
  const error = useFieldError(name);
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input id={id} name={name} type="checkbox" className="checkbox" {...input} />
        <label htmlFor={id} className="text-sm text-cocoa-800">
          <span className="font-semibold">{label}</span>
          {hint ? <span className="mt-0.5 block text-xs text-cocoa-500">{hint}</span> : null}
        </label>
      </div>
      {error ? <p className="field-error pl-8">{error}</p> : null}
    </div>
  );
}

/** Onay isteyen küçük form düğmesi (silme, iptal vb.) */
export function ConfirmButton({
  action,
  fields,
  label,
  confirmText,
  className = "btn btn-sm btn-outline",
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string>;
  label: React.ReactNode;
  confirmText: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
    >
      {Object.entries(fields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
