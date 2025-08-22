import React from 'react'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

function Skeleton({ className = '', ...props }: SkeletonProps) {
  return <div className={`animate-pulse rounded-md bg-white/10 ${className}`} {...props} />
}

export { Skeleton }
