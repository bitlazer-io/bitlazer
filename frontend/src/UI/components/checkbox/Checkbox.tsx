import React, { InputHTMLAttributes } from 'react'
import s from './Checkbox.module.scss'
import clsx from 'clsx'

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string | JSX.Element
  error?: string
  register?: any
}

const Checkbox: React.FC<CheckboxProps> = ({ label, error, register, ...inputProps }) => {
  return (
    <>
      <label className={clsx(s.checkbox, error && s.error, inputProps.disabled && s.disabled)}>
        <input className="hidden" type="checkbox" {...inputProps} {...register} />
        <span className="text-zinc-500 text-sm font-light pl-9 select-none relative inline-block">
          {label}
        </span>
      </label>
      {error && <p className={'m-0 text-xs font-light text-red-500'}>{error}</p>}
    </>
  )
}

export default Checkbox
