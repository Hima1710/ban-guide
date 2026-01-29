/**
 * M3-style text field: surface background, primary bottom-border on focus, floating labels.
 * Min 48px height for touch. Dark-mode safe via CSS variables.
 */

'use client'

import { InputHTMLAttributes, forwardRef, useState } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const MIN_TOUCH_HEIGHT = 48

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      className = '',
      style = {},
      value,
      defaultValue,
      onFocus,
      onBlur,
      onChange,
      ...restProps
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false)
    const [internalValue, setInternalValue] = useState(() =>
      defaultValue != null ? String(defaultValue) : ''
    )
    const isControlled = value !== undefined
    const hasValue =
      (isControlled && value !== null && String(value).trim() !== '') ||
      (!isControlled && internalValue.trim() !== '') ||
      (defaultValue !== undefined && defaultValue !== null && String(defaultValue).trim() !== '')

    const floating = focused || hasValue

    return (
      <div className="w-full">
        <div
          className={`
            relative rounded-extra-large overflow-hidden
            bg-surface border-b-2
            transition-colors duration-200
            ${error ? 'border-error' : focused ? 'border-primary' : 'border-outline'}
          `}
          style={{ minHeight: MIN_TOUCH_HEIGHT }}
        >
          <input
            ref={ref}
            value={value}
            defaultValue={defaultValue}
            className={`
              w-full h-full min-h-[48px]
              pt-5 pb-3 px-4
              bg-transparent
              text-on-surface text-body-large font-medium
              placeholder:text-on-surface-variant placeholder:opacity-70
              focus:outline-none
              ${className}
            `}
            style={{ fontSize: 'var(--md-sys-typescale-body-large-size)', ...style }}
            placeholder={floating ? undefined : ' '}
            onFocus={(e) => {
              setFocused(true)
              onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              if (!isControlled) setInternalValue(e.currentTarget.value)
              onBlur?.(e)
            }}
            onChange={(e) => {
              if (!isControlled) setInternalValue(e.currentTarget.value)
              onChange?.(e)
            }}
            {...restProps}
          />
          {label && (
            <label
              className={`
                absolute left-4 pointer-events-none
                text-on-surface-variant font-medium
                transition-all duration-200 origin-left
                ${floating
                  ? 'top-1.5 text-label-small text-primary'
                  : 'top-1/2 -translate-y-1/2 text-body-large'}
              `}
              style={{
                fontSize: floating
                  ? 'var(--md-sys-typescale-label-small-size)'
                  : 'var(--md-sys-typescale-body-large-size)',
              }}
            >
              {label}
            </label>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-label-small text-error flex items-center gap-1">
            <span aria-hidden>⚠</span>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-label-small text-on-surface-variant opacity-80">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
