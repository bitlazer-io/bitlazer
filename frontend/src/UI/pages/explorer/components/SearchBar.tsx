import React, { FC, useState } from 'react'
import clsx from 'clsx'

interface SearchBarProps {
  onSearch: (query: string) => void
}

export const SearchBar: FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by transaction hash, address, or block..."
          className={clsx(
            'w-full bg-black/60 border border-lightgreen-100/30',
            'text-white font-maison-neue text-base md:text-lg',
            'px-4 py-3 pr-24 rounded-[.115rem]',
            'placeholder:text-white/50',
            'focus:outline-none focus:border-lightgreen-100/60',
            'hover:border-lightgreen-100/50',
            'transition-all duration-200',
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className={clsx(
                'text-white/70 hover:text-lightgreen-100',
                'font-ocrx text-sm uppercase',
                'transition-colors duration-200',
              )}
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className={clsx(
              'bg-lightgreen-100 text-black',
              'font-ocrx text-sm uppercase',
              'px-4 py-1 rounded-[.115rem]',
              'hover:bg-lightgreen-100/90',
              'transition-colors duration-200',
            )}
          >
            Search
          </button>
        </div>
      </div>
    </form>
  )
}
