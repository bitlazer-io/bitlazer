import React, { useEffect, useState } from 'react'
import Select from 'react-select'
import s from './MySelect.module.scss'
import clsx from 'clsx'
import { FieldError, UseFormRegister } from 'react-hook-form'

interface MySelectProps {
  wrapperClassName?: string
  className?: string
  label?: string
  options: any[]
  value?: any
  defaultValue?: any
  onChange?: (value: any) => void
  setValue?: (name: any, value: any) => void
  isMulti?: boolean
  isDefault?: boolean
  placeholder?: string
  defaultSelectedIndex?: number
  name?: string
  error?: FieldError
  disabled?: boolean
  isSearchable?: boolean
  register?: UseFormRegister<any>
  onInputChange?: (value: string) => void
  customFilter?: (option: any, inputValue: string) => boolean
  variant?: 'secondary'
}

const MySelect: React.FC<MySelectProps> = ({
  wrapperClassName,
  className,
  label,
  options,
  defaultValue,
  setValue,
  onChange,
  isMulti,
  isDefault,
  placeholder,
  defaultSelectedIndex,
  name,
  error,
  register,
  disabled,
  isSearchable,
  onInputChange,
  customFilter,
  variant,
  ...otherProps
}) => {
  const [selectedValue, setSelectedValue] = useState<any>()

  useEffect(() => {
    if (defaultSelectedIndex) {
      setSelectedValue(options[defaultSelectedIndex])
    }

    if (defaultValue) {
      const definedValue = options.find(({ value }) => value === defaultValue)
      setSelectedValue(definedValue)

      if (setValue) {
        setValue(name, definedValue?.value || definedValue)
      }
    }
  }, [name, options, setValue, defaultValue, defaultSelectedIndex])

  const handleChange = (selectedOption: { value: string }) => {
    setSelectedValue(selectedOption)

    if (setValue) {
      setValue(name, selectedOption?.value || selectedOption)
    }

    if (onChange) {
      onChange(selectedOption)
    }
  }

  const customStyles = {
    // //@ts-ignore
    // option: (provided, state) => ({
    // 	...provided,
    // 	transition: '.3s',
    // 	backgroundColor: state.isSelected
    // 		? '#44aff7'
    // 		: state.isFocused
    // 		? ' rgba(68, 175, 247, 0.50)'
    // 		: 'transparent'
    // })
  }

  return (
    <label
      className={clsx('flex flex-col relative w-full', s.wrapper, wrapperClassName, {
        [s.default]: isDefault,
      })}
    >
      {label && <span className="text-zinc-300 text-sm font-light mb-1">{label}</span>}
      <Select
        onInputChange={onInputChange}
        isDisabled={disabled}
        instanceId={`my-select-${name || Math.random().toFixed(3)}`}
        styles={customStyles}
        className={clsx(
          s.select,
          className,
          disabled && s.disabled,
          variant === 'secondary' && s.secondary,
        )}
        classNamePrefix="my-select"
        options={options}
        value={selectedValue}
        onChange={handleChange}
        filterOption={customFilter}
        formatOptionLabel={(option) => (
          <div className={clsx(s.option, 'justify-center text-center')}>
            {option.image && (
              <div className={'w-4 h-4 icon'}>
                <img
                  className="w-full h-full object-contain"
                  src={option.image}
                  alt={option.label}
                />
              </div>
            )}
            {option.icon && option.icon}
            <span>{option.label}</span>
          </div>
        )}
        isMulti={isMulti || false}
        placeholder={placeholder || 'Select...'}
        isSearchable={isSearchable ? isSearchable : false}
        {...otherProps}
      />
      {error && <span className={s.error__message}>{error.message}</span>}

      {register && (
        <input
          disabled={disabled}
          type="hidden"
          {...register(name || '', {
            value: selectedValue?.value || selectedValue || '',
          })}
          value={selectedValue?.value || selectedValue || ''}
        />
      )}
    </label>
  )
}

export default MySelect
