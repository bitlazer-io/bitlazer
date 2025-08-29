import React from 'react'
import clsx from 'clsx'

interface WBTCInfoCardProps {
  className?: string
}

const WBTCInfoCard: React.FC<WBTCInfoCardProps> = ({ className }) => {
  const handleGetWBTC = () => {
    window.open('https://app.uniswap.org/', '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className={clsx(
        'relative group w-full mb-3',
        'bg-gradient-to-r from-darkslategray-200/95 via-darkslategray-200/90 to-darkslategray-200/85',
        'border border-lightgreen-100/40 hover:border-lightgreen-100/60',
        'rounded-[.115rem] overflow-hidden',
        'transition-all duration-300',
        className,
      )}
    >
      {/* Background gradient animation on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-lightgreen-100/5 via-transparent to-fuchsia/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          {/* Info icon - properly centered */}
          <div className="flex-shrink-0 flex items-center">
            <svg
              className="w-4 h-4 text-lightgreen-100"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Text content */}
          <div className="flex items-center gap-1.5 text-white/90 font-maison-neue text-xs">
            <span>Need WBTC?</span>
            <span className="text-white/70">Buy with the best price!</span>
          </div>
        </div>

        {/* CTA Button - matching APPROVE/SWITCH button style */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleGetWBTC()
          }}
          className={clsx(
            'px-3 py-1.5',
            'bg-lightgreen-100 hover:bg-lightgreen-200',
            'text-black font-ocrx text-[13px] uppercase tracking-wider',
            'rounded-[.115rem]',
            'transition-all duration-200',
            'hover:shadow-[0_0_20px_rgba(98,255,0,0.3)]',
            'active:scale-95',
            'flex items-center gap-1.5',
          )}
        >
          <span>GET IT NOW</span>
          {/* Redirect/external link icon */}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default WBTCInfoCard
