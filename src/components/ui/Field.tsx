import { useId } from "react";
import { cx } from "@/lib/utils";

type BaseProps = {
  label: string;
  name: string;
  error?: string | string[] | null;
  hint?: React.ReactNode;
  className?: string;
  optional?: boolean;
};

function errorText(error: BaseProps["error"]) {
  if (!error) return null;
  return Array.isArray(error) ? error[0] : error;
}

export function TextField({
  label,
  name,
  error,
  hint,
  className,
  optional,
  ...input
}: BaseProps & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">) {
  const id = useId();
  const message = errorText(error);
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {optional ? <span className="ml-1 font-medium text-cocoa-400">(isteğe bağlı)</span> : null}
      </label>
      <input
        id={id}
        name={name}
        className="field-input"
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...input}
      />
      {message ? (
        <p id={`${id}-error`} className="field-error">
          {message}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextAreaField({
  label,
  name,
  error,
  hint,
  className,
  optional,
  ...input
}: BaseProps & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  const id = useId();
  const message = errorText(error);
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {optional ? <span className="ml-1 font-medium text-cocoa-400">(isteğe bağlı)</span> : null}
      </label>
      <textarea
        id={id}
        name={name}
        className="field-input"
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...input}
      />
      {message ? (
        <p id={`${id}-error`} className="field-error">
          {message}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SelectField({
  label,
  name,
  error,
  hint,
  className,
  optional,
  children,
  ...select
}: BaseProps & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name">) {
  const id = useId();
  const message = errorText(error);
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {optional ? <span className="ml-1 font-medium text-cocoa-400">(isteğe bağlı)</span> : null}
      </label>
      <select
        id={id}
        name={name}
        className="field-input"
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? `${id}-error` : hint ? `${id}-hint` : undefined}
        {...select}
      >
        {children}
      </select>
      {message ? (
        <p id={`${id}-error`} className="field-error">
          {message}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function CheckboxField({
  name,
  label,
  error,
  className,
  ...input
}: { name: string; label: React.ReactNode; error?: string | string[] | null; className?: string } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name" | "type"
>) {
  const id = useId();
  const message = errorText(error);
  return (
    <div className={className}>
      <div className="flex items-start gap-3">
        <input
          id={id}
          name={name}
          type="checkbox"
          className="checkbox"
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? `${id}-error` : undefined}
          {...input}
        />
        <label htmlFor={id} className={cx("text-sm leading-relaxed text-cocoa-700")}>
          {label}
        </label>
      </div>
      {message ? (
        <p id={`${id}-error`} className="field-error pl-8">
          {message}
        </p>
      ) : null}
    </div>
  );
}
