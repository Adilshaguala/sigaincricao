"use client"

import { Controller, useFormContext } from "react-hook-form"
import {
  Fragment,
  memo,
  useRef,
  useSyncExternalStore,
  type ComponentProps,
} from "react"
import * as Flags from "country-flag-icons/react/3x2"
import getCountryFlag from "country-flag-icons/unicode"
import type { RegistrationValues } from "@/lib/registration-schema"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldContent,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  NativeSelect,
  NativeSelectOption,
  NativeSelectOptGroup,
} from "@/components/ui/native-select"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select"

export type EnrollmentOption = {
  value: string
  label: string
  group?: string
  code?: string
}

const OptionLabel = memo(
  function OptionLabel({ option }: { option: EnrollmentOption }) {
    const Flag = option.code
      ? Flags[option.code as keyof typeof Flags]
      : undefined
    return (
      <>
        {Flag && <Flag aria-hidden="true" data-country={option.code} />}
        {option.label}
      </>
    )
  },
  (previous, next) =>
    previous.option.code === next.option.code &&
    previous.option.label === next.option.label
)
type Name = keyof RegistrationValues

function subscribeTouch(callback: () => void) {
  const query = window.matchMedia("(pointer: coarse)")
  query.addEventListener("change", callback)
  return () => query.removeEventListener("change", callback)
}

function isTouchDevice() {
  return window.matchMedia("(pointer: coarse)").matches
}

export function EnrollmentInput({
  name,
  label,
  description,
  formatValue,
  required = true,
  ...props
}: {
  name: Name
  label: string
  description?: string
  formatValue?: (value: string) => string
} & Omit<ComponentProps<typeof Input>, "name" | "value" | "defaultValue">) {
  const { control, trigger, clearErrors } = useFormContext<RegistrationValues>()
  const edited = useRef(false)
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} data-disabled={field.disabled}>
          <FieldLabel htmlFor={name}>
            {label}
            {required && <span aria-hidden="true">*</span>}
          </FieldLabel>
          <Input
            {...props}
            {...field}
            onBlur={(event) => {
              field.onBlur()
              // Navigation validates explicitly. Avoid moving a clicked button
              // between pointer-down and click when an error is inserted.
              if (
                event.relatedTarget instanceof Element &&
                event.relatedTarget.closest(
                  '[data-slot="button"], [role="tab"]'
                )
              )
                return
              if (edited.current || field.value) void trigger(name)
            }}
            onChange={(event) => {
              edited.current = true
              const input = event.target
              const raw = input.value
              const caret = input.selectionStart
              field.onChange(formatValue ? formatValue(raw) : raw)
              clearErrors(name)
              if (formatValue && caret !== null) {
                const nextCaret = formatValue(raw.slice(0, caret)).length
                requestAnimationFrame(() => {
                  if (document.activeElement === input)
                    input.setSelectionRange(nextCaret, nextCaret)
                })
              }
            }}
            id={name}
            required={required}
            aria-required={required}
            aria-invalid={fieldState.invalid}
            aria-describedby={
              [
                description ? `${name}-description` : "",
                fieldState.invalid ? `${name}-error` : "",
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
          />
          {description && (
            <FieldDescription id={`${name}-description`}>
              {description}
            </FieldDescription>
          )}
          {fieldState.invalid && (
            <FieldError id={`${name}-error`} errors={[fieldState.error]} />
          )}
        </Field>
      )}
    />
  )
}

export function EnrollmentSelect({
  name,
  label,
  options,
  placeholder,
  description,
  onChange,
}: {
  name: Name
  label: string
  options: EnrollmentOption[]
  placeholder: string
  description?: string
  onChange?: () => void
}) {
  const { control, trigger } = useFormContext<RegistrationValues>()
  const touchDevice = useSyncExternalStore(
    subscribeTouch,
    isTouchDevice,
    () => false
  )
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={fieldState.invalid}
          data-disabled={field.disabled || options.length === 0}
        >
          <FieldLabel htmlFor={name}>
            {label} <span aria-hidden="true">*</span>
          </FieldLabel>
          {touchDevice ? (
            <NativeSelect
              ref={field.ref}
              id={name}
              name={field.name}
              className="w-full"
              value={field.value}
              onChange={(event) => {
                if (event.target.value !== field.value) {
                  field.onChange(event)
                  onChange?.()
                }
                if (fieldState.invalid) void trigger(name)
              }}
              onBlur={field.onBlur}
              required
              disabled={field.disabled || options.length === 0}
              aria-required
              aria-invalid={fieldState.invalid}
              aria-describedby={
                [
                  description ? `${name}-description` : "",
                  fieldState.invalid ? `${name}-error` : "",
                ]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
            >
              <NativeSelectOption value="" disabled>
                {placeholder}
              </NativeSelectOption>
              {Array.from(
                new Set(options.map((item) => item.group ?? label))
              ).map((group) => (
                <NativeSelectOptGroup key={group} label={group}>
                  {options
                    .filter((item) => (item.group ?? label) === group)
                    .map((item) => (
                      <NativeSelectOption key={item.value} value={item.value}>
                        {item.code ? `${getCountryFlag(item.code)} ` : ""}
                        {item.label}
                      </NativeSelectOption>
                    ))}
                </NativeSelectOptGroup>
              ))}
            </NativeSelect>
          ) : (
            <Select
              name={field.name}
              value={field.value || null}
              items={options}
              required
              disabled={field.disabled || options.length === 0}
              onValueChange={(value) => {
                const nextValue = value ?? ""
                // Base UI also notifies when the selected item is selected again.
                // Do not clear dependent academic fields unless the level changes.
                if (nextValue !== field.value) {
                  field.onChange(nextValue)
                  onChange?.()
                }
                void trigger(name)
              }}
            >
              <SelectTrigger
                ref={field.ref}
                id={name}
                onBlur={field.onBlur}
                className="w-full"
                aria-required
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  [
                    description ? `${name}-description` : "",
                    fieldState.invalid ? `${name}-error` : "",
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
              >
                <SelectValue placeholder={placeholder}>
                  {(value) => {
                    const selected = options.find(
                      (item) => item.value === value
                    )
                    return selected ? (
                      <OptionLabel option={selected} />
                    ) : (
                      placeholder
                    )
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {Array.from(
                  new Set(options.map((item) => item.group ?? label))
                ).map((group, index) => (
                  <Fragment key={group}>
                    {index > 0 && <SelectSeparator />}
                    <SelectGroup>
                      <SelectLabel>{group}</SelectLabel>
                      {options
                        .filter((item) => (item.group ?? label) === group)
                        .map((item) => (
                          <SelectItem
                            key={item.value}
                            value={item.value}
                            label={item.label}
                          >
                            <OptionLabel option={item} />
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </Fragment>
                ))}
              </SelectContent>
            </Select>
          )}
          {description && (
            <FieldDescription id={`${name}-description`}>
              {description}
            </FieldDescription>
          )}
          {fieldState.invalid && (
            <FieldError id={`${name}-error`} errors={[fieldState.error]} />
          )}
        </Field>
      )}
    />
  )
}

export function CourseFields({
  courses,
  centers,
}: {
  courses: { id: string; name: string }[]
  centers: { id: string; name: string; location: string }[]
}) {
  const { control, trigger } = useFormContext<RegistrationValues>()
  return (
    <FieldGroup>
      <EnrollmentSelect
        name="courseId"
        label="Curso pretendido"
        placeholder="Selecione o curso"
        options={courses.map((course) => ({
          value: course.id,
          label: course.name,
        }))}
      />
      <EnrollmentSelect
        name="resourceCenterId"
        label="Centro de recursos"
        placeholder="Selecione o centro"
        description="Escolha o centro onde pretende receber apoio académico."
        options={centers.map((center) => ({
          value: center.id,
          label: `${center.name} · ${center.location}`,
        }))}
      />
      <Controller
        name="declaration"
        control={control}
        render={({ field, fieldState }) => (
          <Field
            orientation="horizontal"
            data-invalid={fieldState.invalid}
            data-disabled={field.disabled}
          >
            <Checkbox
              id="declaration"
              name={field.name}
              value="on"
              ref={field.ref}
              checked={field.value === "on"}
              onCheckedChange={(checked) => {
                field.onChange(checked ? "on" : "")
                void trigger("declaration")
              }}
              onBlur={field.onBlur}
              required
              aria-required
              disabled={field.disabled}
              aria-invalid={fieldState.invalid}
              aria-describedby={
                fieldState.invalid ? "declaration-error" : undefined
              }
            />
            <FieldContent>
              <FieldLabel htmlFor="declaration">
                Confirmo que os dados são verdadeiros e compreendo que a
                inscrição não poderá ser alterada após a submissão.{" "}
                <span aria-hidden="true">*</span>
              </FieldLabel>
              {fieldState.invalid && (
                <FieldError
                  id="declaration-error"
                  errors={[fieldState.error]}
                />
              )}
            </FieldContent>
          </Field>
        )}
      />
    </FieldGroup>
  )
}
