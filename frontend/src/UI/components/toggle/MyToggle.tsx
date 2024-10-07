import React, { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

interface MyToggleProps extends InputHTMLAttributes<any> {
  label?: string | JSX.Element
  className?: string
  error?: string
  register?: any
}

const MyToggle: React.FC<MyToggleProps> = ({
  label,
  error,
  register,
  className,
  ...inputProps
}) => {
  return (
    <>
      <label className={clsx('inline-flex items-center cursor-pointer', className)}>
        {label && <span className="ms-3 text-sm font-medium text-white">{label}</span>}

        <input type="checkbox" className="sr-only peer" {...inputProps} {...register} />
        <div className="relative w-[2.625rem] transition-all duration-200 h-6 bg-slate-800 border border-gray-200/opacity-10 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-transparent rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[.06rem] after:start-[.125rem] after:bg-[#0F1822] peer-checked:after:start-[-0.075rem] peer-checked:after:bg-gradient-to-b peer-checked:after:from-indigo-700 peer-checked:after:to-blue-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700 after:bg-gray-900"></div>
      </label>

      {error && <p className={'m-0 text-xs font-light text-red-500'}>{error}</p>}
    </>
  )
}

export default MyToggle
