import { Link } from "@tanstack/react-router";
import { CheckCircle } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { btnPrimary } from "@/components/site/ui";
import { cn } from "@/lib/utils";

/** Shared pieces for the public application forms (1-1 training and Red Pill). */

export const inputClass =
  "mt-2 h-12 rounded-lg border border-border bg-input text-[15px] text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30";
export const textareaClass =
  "mt-2 block min-h-[132px] w-full resize-y rounded-lg border border-border bg-input px-3 py-3 text-[15px] leading-relaxed text-foreground transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-6">
      <legend className="mb-6 w-full border-b border-border pb-3 font-display text-lg font-bold tracking-tight">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

export function Field({
  name,
  label,
  error,
  group,
  children,
}: {
  name: string;
  label: string;
  error?: string;
  /** Radio groups are labelled by a div, text inputs by a <label for>. */
  group?: boolean;
  children: ReactNode;
}) {
  return (
    <div data-field={name}>
      {group ? (
        <p className="text-sm font-medium">{label}</p>
      ) : (
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
        </Label>
      )}
      {children}
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function ChoiceGroup({
  name,
  options,
  value,
  onChange,
  single,
}: {
  name: string;
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  /** One column, for long labels. */
  single?: boolean;
}) {
  return (
    <div role="radiogroup" className={cn("mt-3 grid gap-2", !single && "sm:grid-cols-2")}>
      {options.map((o) => {
        const checked = value === o.value;
        return (
          <label
            key={o.value}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-[14.5px] leading-snug transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
              checked ? "border-primary bg-hover" : "border-border bg-input hover:bg-hover",
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={checked}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "grid size-4 shrink-0 place-items-center rounded-full border",
                checked ? "border-primary" : "border-muted-foreground/50",
              )}
            >
              {checked && <span className="size-2 rounded-full bg-primary" />}
            </span>
            {o.label}
          </label>
        );
      })}
    </div>
  );
}

export function Message({ title, body, icon }: { title: string; body: string; icon?: boolean }) {
  return (
    <div className="py-8 text-center md:py-14">
      {icon && <CheckCircle className="mx-auto size-12 text-primary" weight="fill" />}
      <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight">{title}</h2>
      <p className="mx-auto mt-3 max-w-[44ch] leading-relaxed text-muted-foreground">{body}</p>
      <Link to="/" className={`${btnPrimary} mt-8`}>
        Back to Blueprint
      </Link>
    </div>
  );
}
