"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { IconCheck, IconEye, IconEyeOff } from "@/components/ui/Icon";
import { cx } from "@/lib/format";

/**
 * Form fields.
 *
 * The control is a bottom hairline, not a box. This is the same field the
 * journal form in the footer already uses, and it is the reason the site reads
 * as printed matter rather than as a settings panel: the rule carries the
 * structure, the label carries the meaning, and nothing is enclosed.
 *
 * Focus is a second line, not an outline. `globals.css` puts a 2px beige-3
 * outline on every `input:focus-visible`, and an earlier pass moved that ring up
 * to the row with `focus-within` so it would span the full width. It was wrong:
 * clicking a field drew a box around the whole thing, which is precisely the
 * "settings panel" look the hairline exists to avoid, and it arrived on *click*
 * rather than on keyboard focus, so a mouse user got a loud box they did not
 * ask for.
 *
 * So the ring is gone and the line carries it instead. The hairline turns
 * beige-3, and a second 1px rule grows from the left along the bottom edge.
 * That second rule is a pseudo-element rather than a border-width change,
 * because growing the border would resize the row and shove the field below it
 * down a pixel, and nothing on this site is allowed to move. The input keeps
 * `focus:outline-none` so the base rule cannot put a box on the text area
 * either.
 *
 * The line goes gold rather than to full ink because beige-3 is already the
 * accent the whole site marks an interactive element with, the same colour the
 * arrow CTA underlines to on hover. A focused field that turns gold reads as the
 * same gesture as a hovered link, which is the point. It is also the one colour
 * in the palette that `globals.css` measures on both grounds, 3.80:1 on paper
 * and 4.47:1 on navy, so the same rule serves the light and the dark band with
 * no `.on-navy` override. It is `--color-focus`, the same token the site-wide
 * focus ring is built from, so nothing here is a private colour.
 *
 * Errors carry a non-colour signal too. The rule turns `border-error` and the
 * message is text, so it survives greyscale; the red alone would not.
 */

/** The row: hairline, focus line, and the invalid state in one place. */
function rowClass(invalid: boolean, onDark: boolean): string {
  return cx(
    "relative flex items-center gap-xs border-b pb-2",
    "transition-colors dur-base ease-out",
    /* The second rule. `content-['']` is required or the pseudo-element never
       renders. It sits 1px below the border, so the pair reads as one 2px line
       rather than as two lines a pixel apart. */
    "after:absolute after:inset-x-0 after:-bottom-px after:h-px after:content-['']",
    "after:origin-left after:scale-x-0 after:transition-transform after:dur-base after:ease-out",
    "focus-within:after:scale-x-100",
    /* Only the resting rule differs by ground. The focus colour is shared. */
    invalid
      ? "border-error after:bg-error"
      : cx(
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

/**
 * One field: label, row, hint, error.
 *
 * The label is `.eyebrow` and the supporting copy is `text-muted`, both of which
 * read off the ink family, so they invert under `.on-navy` on their own. There
 * is deliberately no `onDark` here: a light and a dark variant of a label is a
 * label that will be wrong the first time the ground changes again.
 *
 * The error is wired with `aria-describedby` and `aria-invalid` rather than
 * colour, so it is announced when focus lands on the field instead of only when
 * it is looked for.
 */
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
      <label htmlFor={id} className="eyebrow block">
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

/**
 * A password field with a visibility toggle.
 *
 * The toggle sits inside the row so the hairline runs under it and the control
 * still reads as one field rather than an input with a button parked next to
 * it. Revealing the password is a real need, not a nicety: a person setting a
 * new one cannot check the last character from a field full of dots.
 */
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
 * A tick box. Native input, restyled, because a checkbox built from divs is a
 * checkbox a screen reader cannot find.
 *
 * The tick is the non-colour signal: the box gains a border and a glyph when
 * checked, and keeps both when it is not, so the state is legible without
 * colour.
 *
 * The checked state is beige-3 with a navy tick rather than ink with a paper
 * tick, and that is a bug fix rather than a preference. Both of those were ink
 * family tokens, and `.on-navy` re-points `--color-ink` to off-white while
 * deliberately leaving `--color-paper` alone, so on a navy band the box painted
 * itself off-white and the tick painted itself off-white too. Accepting the
 * terms rendered a white square with nothing in it. beige-3 and navy are both
 * outside the remapped family, so the two grounds behave identically here.
 */
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
      {/* `items-start` rather than `items-center`, because this label wraps to
          two or three lines around the links in the terms text, and centring the
          box against the whole block would drop it into the middle of the
          second line. It has to be aligned to the first line.

          The nudge is arithmetic, not taste. At `text-sm` with `leading-relaxed`
          the line box is 22.75px, and Inter's ink sits low in it, so the optical
          centre of the first line lands at roughly 12.8px from the top. A 16px
          box has to start at about 4.8px to match, which is `mt-3xs`. At the
          `mt-2xs` it used to be, the box started 8px down, putting its centre
          near 16px and leaving the text visibly riding above it. */}
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
        /* Inset by the box plus the gap, so the message starts under the words
           and not under the tick box: 1rem of box and 0.75rem of `gap-xs`. */
        <p id={`${id}-error`} className="mt-2xs pl-[1.75rem] text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * The status line a form reports back with: a rule in the accent colour plus a
 * sentence. Used for the seam notice, and available for whatever your auth route
 * returns once it exists.
 */
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
