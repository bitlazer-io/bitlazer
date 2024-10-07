import React, { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

type list = {
  name: string
  value: string
}

interface ButtonGroup {
  list: Array<list>
  active: list
  onClick?: (e: list) => void
}

const ButtonGroup: React.FC<ButtonGroup> = ({ list, active, onClick }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<HTMLDivElement[]>([])
  const [indicatorStyles, setIndicatorStyles] = useState<React.CSSProperties>({})

  const setTabRef = (element: HTMLDivElement | null, index: number) => {
    if (element) {
      tabRefs.current[index] = element
    }
  }

  const updateIndicator = () => {
    const activeIndex = list.findIndex((tab) => tab.value === active.value)
    const activeTabElement = tabRefs.current[activeIndex]
    const containerElement = containerRef.current

    if (activeTabElement && containerElement) {
      const containerRect = containerElement.getBoundingClientRect()
      const activeTabRect = activeTabElement.getBoundingClientRect()

      setIndicatorStyles({
        width: `${activeTabRect.width}px`,
        transform: `translateX(${activeTabRect.left - containerRect.left - 4}px)`, // 4 = padding
      })
    }
  }

  useEffect(() => {
    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [active, list])

  return (
    <div
      ref={containerRef}
      className="w-full flex items-center gap-1 h-9 p-1 bg-slate-700 rounded-3xl border border-gray-200/opacity-10 relative flex-shrink-0"
    >
      <div
        className="absolute h-7 bg-blue-400 rounded-3xl transition-all duration-300 ease-in-out"
        style={indicatorStyles}
      />
      {list?.map((btn, index) => (
        <div
          className={clsx(
            'relative z-10 w-full h-full flex items-center justify-center transition rounded-3xl',
            active?.value === btn.value ? 'text-white' : 'text-gray-300',
          )}
          key={`btn-group-${index}`}
          onClick={() => onClick?.(btn)}
          ref={(element) => setTabRef(element, index)}
        >
          {btn.name}
        </div>
      ))}
    </div>
  )
}

export default ButtonGroup
