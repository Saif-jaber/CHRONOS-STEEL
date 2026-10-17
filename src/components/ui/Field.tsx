"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { IconCheck, IconEye, IconEyeOff } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

function rowClass(invalid: boolean, onDark: boolean): string {
  return cx(
    "relative flex items-center gap-xs border-b pb-2",
    "transition-colors dur-base ease-out",
    /* Second rule needs an explicit empty content value or the pseudo-element
       never renders; it sits 1px below the border so the pair reads as one line. */
    "after:absolute after:inset-x-0 after:-bottom-px after:h-px after:content-['']",
    "after:origin-left after:transition-transform after:dur-base after:ease-out",
    /* Invalid fields draw the second line at rest as a solid 2px error rule, so
       the resting scale lives only in the valid branch and the two never disagree. */
    invalid
      ? "border-error after:bg-error after:scale-x-100"
      : cx(
          "after:scale-x-0",
          "focus-within:after:scale-x-100",
          onDark ? "border-navy-rule" : "border-rule-2",
          "focus-within:border-beige-3 after:bg-beige-3",
        ),
  );
}

function controlClass(onDark: boolean): string {
  return cx(
    "min-w-0 flex-1 bg-transparent py-xs text-sm",
    onDark ? "text-paper placeholder:text-navy-muted" : "text-ink placeholder:text-faint",
    "focus:outline-none",
  );
}

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  /** Standing guidance. Sits under the row and never changes colour. */
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className={cx("eyebrow block", error && "text-error")}>
        {label}
      </label>

      <div className="mt-2xs">{children}</div>

      {hint ? (
        <p className="mt-2xs text-xs leading-relaxed text-muted">{hint}</p>
      ) : null}

      {error ? (
        <p id={`${id}-error`} className="mt-2xs text-xs leading-relaxed text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  onDark = false,
  type = "text",
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  onDark?: boolean;
  /** Narrowed to what these forms need rather than the full HTML type union. */
  type?: "text" | "email" | "tel";
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange" | "type">) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <div className={rowClass(Boolean(error), onDark)}>
        <input
          id={id}
          name={rest.name ?? id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={controlClass(onDark)}
          {...rest}
        />
      </div>
    </Field>
  );
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  onDark = false,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  onDark?: boolean;
  autoComplete?: string;
}) {
  const [shown, setShown] = useState(false);

  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <div className={rowClass(Boolean(error), onDark)}>
        <input
          id={id}
          name={id}
          type={shown ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={controlClass(onDark)}
        />
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-pressed={shown}
          className={cx(
            "hit relative inline-flex size-6 shrink-0 items-center justify-center",
            "transition-opacity dur-base ease-out hover:opacity-60",
            onDark ? "text-navy-muted" : "text-faint",
          )}
        >
          <span className="sr-only">{shown ? `Hide ${label}` : `Show ${label}`}</span>
          {shown ? (
            <IconEyeOff onDark={onDark} className="size-4" />
          ) : (
            <IconEye onDark={onDark} className="size-4" />
          )}
        </button>
      </div>
    </Field>
  );
}

/**
 * Kept as a string so an empty box stays empty rather than becoming a zero
 * the seller did not type. `inputMode="decimal"` asks a phone for the number pad.
 */
export function NumberField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  onDark = false,
  min,
  max,
  step,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  onDark?: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <div className={rowClass(Boolean(error), onDark)}>
        <input
          id={id}
          name={id}
          type="number"
          inputMode="decimal"
          value={value}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={controlClass(onDark)}
        />
      </div>
    </Field>
  );
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  hint,
  error,
  onDark = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  hint?: string;
  error?: string;
  onDark?: boolean;
}) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <div className={rowClass(Boolean(error), onDark)}>
        <select
          id={id}
          name={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cx(controlClass(onDark), "appearance-none")}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </Field>
  );
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  rows = 4,
  hint,
  error,
  onDark = false,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
  error?: string;
  onDark?: boolean;
  placeholder?: string;
}) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <div className={cx(rowClass(Boolean(error), onDark), "items-start")}>
        <textarea
          id={id}
          name={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cx(controlClass(onDark), "resize-y leading-relaxed")}
        />
      </div>
    </Field>
  );
}

export function ColorField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
}) {
  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <div className={rowClass(Boolean(error), false)}>
        <input
          id={`${id}-swatch`}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} colour picker`}
          className="size-6 shrink-0 cursor-pointer border border-rule-2 bg-transparent"
        />
        <input
          id={id}
          name={id}
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={controlClass(false)}
        />
      </div>
    </Field>
  );
}

export function Checkbox({
  id,
  checked,
  onChange,
  children,
  error,
  onDark = false,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  error?: string;
  onDark?: boolean;
}) {
  return (
    <div>
      {/* items-start: this label wraps, so a centred box would drop into the
          second line. The 3px nudge optically centres the box on the first line. */}
      <label htmlFor={id} className="flex cursor-pointer items-start gap-xs">
        <span className="relative mt-3xs flex size-4 shrink-0 items-center justify-center">
          <input
            id={id}
            name={id}
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className="peer absolute inset-0 size-full cursor-pointer opacity-0"
          />
          <span
            aria-hidden="true"
            className={cx(
              "flex size-4 items-center justify-center border transition-colors dur-base ease-out",
              "peer-focus-visible:outline-2 peer-focus-visible:outline-focus peer-focus-visible:outline-offset-2",
              error
                ? "border-error"
                : checked
                  ? "border-beige-3 bg-beige-3"
                  : onDark
                    ? "border-navy-muted"
                    : "border-rule-2",
            )}
          >
            {checked ? <IconCheck className="size-3 text-navy" /> : null}
          </span>
        </span>
        <span className="text-sm leading-relaxed text-muted">{children}</span>
      </label>

      {error ? (
        /* Inset past the box plus gap, so the message aligns with the words. */
        <p id={`${id}-error`} className="mt-2xs pl-[1.75rem] text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormNote({
  tone = "info",
  children,
}: {
  tone?: "info" | "error";
  children: ReactNode;
}) {
  const id = useId();
  return (
    <p
      id={id}
      role="status"
      aria-live="polite"
      className={cx(
        "border-l-2 py-2xs pl-xs text-sm leading-relaxed",
        tone === "error" ? "border-error text-error" : "border-beige-3 text-muted",
      )}
    >
      {children}
    </p>
  );
}
