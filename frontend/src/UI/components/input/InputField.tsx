/* eslint-disable no-useless-escape */

import React, { InputHTMLAttributes, forwardRef } from 'react'
import { UseFormRegister, Control } from 'react-hook-form'

import clsx from 'clsx'

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  name?: string
  register?: UseFormRegister<any>
  control?: Control<any>
  error?: any
  isLarge?: boolean
  withoutShadow?: boolean
  required?: boolean
  type?: string
  iconBefore?: JSX.Element
  button?: JSX.Element
  inputClassName?: string
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      required = false,
      className,
      inputClassName,
      label,
      placeholder,
      name,
      register,
      error,
      isLarge,
      type = 'text',
      button,
      iconBefore,
      withoutShadow,
      ...props
    },
    ref,
  ) => {
    const validateEmail = (value: string) => {
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i
      return emailRegex.test(value) || 'Invalid email address!'
    }

    const validatePhone = (value: string) => {
      const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
      return phoneRegex.test(value) || 'Invalid phone number!'
    }

    const validatePassword = (value: string) => {
      const minLength = 6
      if (value.length < minLength) {
        return `Password must be at least ${minLength} characters long`
      }
      return true
    }

    return (
      <div className={clsx('flex flex-col w-full', className, error && 'error', isLarge && 'large')}>
        {label && (
          <div className="mb-[0.687rem] flex items-center justify-between gap-1">
            {label && <span className="tracking-[-0.06em] leading-[1.25rem]">{label}</span>}
          </div>
        )}
        <label
          className={clsx(!withoutShadow && ' shadow-[0px_0px_12px_#68d861] rounded-[1.84px]', ' relative w-full ')}
        >
          {iconBefore && (
            <span className="icon fill-white absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none">
              {iconBefore}
            </span>
          )}
          <span
            className={clsx(
              !withoutShadow &&
                'shadow-[-1.8px_-0.9px_3.69px_rgba(215,_215,_215,_0.31)_inset,_1.8px_1.8px_1.84px_rgba(104,_216,_97,_0.22)_inset]  rounded-[.115rem]',
              ' w-full block h-full',
            )}
          >
            <input
              className={clsx(
                'placeholder:text-lightgreen-300 text-lightgreen-100 py-[0.5rem] px-[1.25rem] pt-5 text-[1.45rem] rounded-[.115rem] w-full font-ocrx text-center disabled:opacity-40 disabled:pointer-events-none disabled:touch-none',
                iconBefore && '!pl-12',
                inputClassName,
              )}
              ref={ref}
              placeholder={placeholder}
              type={type || 'text'}
              id={name}
              value={name}
              onChange={(e) => {
                props.onChange && props.onChange(e)
              }}
              {...(register &&
                name &&
                register(name, {
                  required: required ? 'The field is required!' : false,
                  validate:
                    type === 'email'
                      ? validateEmail
                      : type === 'tel'
                        ? validatePhone
                        : type === 'password'
                          ? validatePassword
                          : undefined,
                }))}
              {...props}
            />
          </span>
        </label>
        {button && button}
        {error && <small className="mt-1.5 text-xs font-light text-red-500">{error}</small>}
      </div>
    )
  },
)

InputField.displayName = 'InputField'

export default InputField
