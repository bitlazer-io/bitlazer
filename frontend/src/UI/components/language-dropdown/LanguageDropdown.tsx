import { FC, useEffect, useRef, useState } from 'react'
import { ChevronDownIcon } from '@svgs'

import clsx from 'clsx'
import flag_de from '../../../assets/images/de.png'
import flag_cz from '../../../assets/images/cz.png'
import flag_pl from '../../../assets/images/pl.png'

import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'

interface ILanguageDropdown {}

export const languageOptions = [
  { value: 'de', label: 'Deutsch', flag: flag_de },
  { value: 'pl', label: 'Polski', flag: flag_pl },
  { value: 'cz', label: 'čeština', flag: flag_cz },
]

const LanguageDropdown: FC<ILanguageDropdown> = () => {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language)

  const handleChange = (selectedOption: any) => {
    setSelectedLanguage(selectedOption.value)
    i18n.changeLanguage(selectedOption.value)
    localStorage.setItem('language', selectedOption.value)
    navigate(pathname)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const getOptionByValue = (value: string) => {
    return languageOptions.find((option) => option.value === value)
  }

  return (
    <div className="flex absolute left-0" ref={dropdownRef}>
      <button
        className="flex items-center gap-2 px-4 py-2.5"
        onClick={(e) => {
          e.preventDefault()
          setShowDropdown(!showDropdown)
        }}
      >
        <div className="w-4 h-4 relative rounded-full shrink-0 overflow-hidden">
          <img
            key={selectedLanguage}
            className="w-full h-full object-cover"
            src={getOptionByValue(selectedLanguage)?.flag}
            alt=""
          />
        </div>
        {/* <div className="text-white text-sm font-semibold uppercase">{selectedLanguage}</div> */}
        <div
          className={clsx(
            'w-4 h-4 relative icon fill-white transition-all duration-200',
            showDropdown && 'rotate-180',
          )}
        >
          <ChevronDownIcon />
        </div>
      </button>

      {showDropdown && (
        <div className="p-2 bg-neutral-800 rounded-2xl backdrop-blur-[3.125rem] flex flex-col absolute z-30 right-0 top-[3.125rem] overflow-hidden">
          {languageOptions.map((option) => (
            <button
              key={option.value}
              className="h-8 p-2 rounded-lg justify-start items-center gap-2 flex transition-all duration-300 hover:bg-[#474950]"
              onClick={(e) => {
                e.preventDefault()
                handleChange(option)
              }}
            >
              <div className="w-4 h-4 relative rounded-full shrink-0 overflow-hidden">
                <img
                  key={option.flag}
                  className="w-full h-full object-cover"
                  src={option.flag}
                  alt=""
                />
              </div>
              <div className="text-white text-xs font-normal">{option.label}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LanguageDropdown
