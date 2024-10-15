import React, { PropsWithChildren, TextareaHTMLAttributes } from 'react'
import { UseFormRegister } from 'react-hook-form'

import s from './TextAreaField.module.scss'
import clsx from 'clsx'

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string
  label: string
  name: string
  placeholder?: string
  error?: any
  isLarge?: boolean
  register: UseFormRegister<any>
}

const TextAreaField: React.FC<PropsWithChildren<TextAreaFieldProps>> = ({
  className,
  label,
  placeholder,
  name,
  error,
  isLarge,
  register,
  children,
}) =>
  label ? (
    <div className={clsx(s.wrapper, className, error && s.error, isLarge && s.large)}>
      <span className={s.label}>{label}</span>
      <textarea className={clsx(s.textarea, className)} placeholder={placeholder} id={name} {...register(name)}>
        {children}
      </textarea>
    </div>
  ) : (
    <textarea className={clsx(s.field, className)} placeholder={placeholder} id={name} {...register(name)}>
      {children}
    </textarea>
  )

export default TextAreaField
