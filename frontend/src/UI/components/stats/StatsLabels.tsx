import React from 'react'

interface PrimaryLabelProps {
  children: React.ReactNode
  className?: string
}

interface SecondaryLabelProps {
  children: React.ReactNode
  className?: string
}

// Primary label for main headings like "WBTC Price", "ARBITRUM", etc.
export const PrimaryLabel: React.FC<PrimaryLabelProps> = ({ children, className = '' }) => {
  return (
    <div className={`text-sm md:text-base lg:text-lg font-ocrx text-white/90 uppercase tracking-wider ${className}`}>
      {children}
    </div>
  )
}

// Secondary label for descriptive text like "BLOCK", "GWEI", "WBTC → lzrBTC", etc.
export const SecondaryLabel: React.FC<SecondaryLabelProps> = ({ children, className = '' }) => {
  return <div className={`text-sm md:text-base text-white/70 font-ocrx uppercase ${className}`}>{children}</div>
}

// Large decorative label like "USERS"
export const DecorativeLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`text-3xl text-lightgreen-100/50 ${className}`}>
      <span className="font-ocrx">{children}</span>
    </div>
  )
}
