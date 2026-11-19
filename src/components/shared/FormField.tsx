"use client";

/* One form field on react-hook-form (forms skill §2): the app's own labelled `Field` around one of
   its controls, wired to the form through a `Controller`. Label ↔ control, hint, counter, error
   (`role="alert"`) and aria-invalid / aria-describedby all come from `Field`, so a FormField looks
   and reads exactly like a hand-written one. Required-ness lives in the Zod schema, never a prop.

   Checkboxes, toggles, choices, chips and other custom controls use `Controller` directly with
   the ui primitive. */

import { Controller, type FieldPath, type FieldValues, type UseFormReturn } from "react-hook-form";
import { Counter, Field } from "@/components/ui/field";
import { Input, PasswordInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Option {
  value: string;
  label: string;
}

type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "type" | "form"
>;

interface BaseProps<TValues extends FieldValues, TOutput> {
  // biome-ignore lint/suspicious/noExplicitAny: the form's context type is irrelevant to a field
  form: UseFormReturn<TValues, any, TOutput>;
  name: FieldPath<TValues>;
  label: string;
  hint?: React.ReactNode;
  optional?: boolean;
  /** Shows "n / max" beside the label; the schema enforces the limit. */
  counterMax?: number;
  className?: string;
  /** Classes for the control itself. */
  controlClassName?: string;
  /** Runs after the form's own onChange, e.g. to clear errors the way the form always has. */
  onValueChange?: (value: string) => void;
  /** An error the screen keeps itself (shown in place of the form's own), for screens whose
      message outlives a later submit. */
  error?: string;
}

type KindProps =
  | ({ kind?: "text" | "email" | "password" } & InputProps)
  | ({ kind: "textarea"; hardStop?: boolean; max?: number } & Omit<
      React.TextareaHTMLAttributes<HTMLTextAreaElement>,
      "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "form"
    >)
  | ({ kind: "select"; options: readonly Option[] } & Omit<
      React.SelectHTMLAttributes<HTMLSelectElement>,
      "name" | "value" | "defaultValue" | "onChange" | "onBlur" | "form"
    >);

export type FormFieldProps<TValues extends FieldValues, TOutput> = BaseProps<TValues, TOutput> &
  KindProps;

export function FormField<TValues extends FieldValues, TOutput>({
  form,
  name,
  label,
  hint,
  optional,
  counterMax,
  className,
  controlClassName,
  onValueChange,
  error,
  ...kindProps
}: FormFieldProps<TValues, TOutput>) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => {
        const value = (field.value ?? "") as string;
        const onChange = (
          e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
        ) => {
          field.onChange(e.target.value);
          onValueChange?.(e.target.value);
        };
        const wired = {
          name: field.name,
          value,
          onChange,
          onBlur: field.onBlur,
          disabled: field.disabled,
        };
        let control: React.ReactNode;
        if (kindProps.kind === "textarea") {
          const { kind: _kind, ...rest } = kindProps;
          control = <Textarea {...rest} {...wired} ref={field.ref} className={controlClassName} />;
        } else if (kindProps.kind === "select") {
          const { kind: _kind, options, ...rest } = kindProps;
          control = (
            <Select {...rest} {...wired} ref={field.ref} className={controlClassName}>
              {options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          );
        } else if (kindProps.kind === "password") {
          const { kind: _kind, ...rest } = kindProps;
          control = <PasswordInput {...rest} {...wired} ref={field.ref} />;
        } else {
          const { kind, ...rest } = kindProps;
          control = (
            <Input
              {...rest}
              {...wired}
              ref={field.ref}
              type={kind ?? "text"}
              className={controlClassName}
            />
          );
        }
        return (
          <Field
            label={label}
            hint={hint}
            optional={optional}
            error={error ?? fieldState.error?.message}
            className={className}
            counter={counterMax ? <Counter value={value} max={counterMax} /> : undefined}
          >
            {control}
          </Field>
        );
      }}
    />
  );
}
