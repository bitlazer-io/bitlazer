import React, { useEffect, useState } from 'react'

interface TypewriterTextProps {
  text: string
  delay?: number // Delay between characters in ms
  initialDelay?: number // Delay before starting animation
  cursor?: boolean // Show blinking cursor
  cursorChar?: string // Cursor character
  className?: string
  onComplete?: () => void
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  delay = 40, // Faster than the home page for a snappier feel
  initialDelay = 100,
  cursor = true,
  cursorChar = '_',
  className = '',
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (currentIndex === 0 && initialDelay > 0) {
      const initialTimer = setTimeout(() => {
        setCurrentIndex(1)
      }, initialDelay)
      return () => clearTimeout(initialTimer)
    }

    if (currentIndex > 0 && currentIndex <= text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex))
        setCurrentIndex(currentIndex + 1)
      }, delay)
      return () => clearTimeout(timer)
    }

    if (currentIndex > text.length && !isComplete) {
      setIsComplete(true)
      if (onComplete) {
        onComplete()
      }
      // Keep cursor blinking for a bit then hide it
      setTimeout(() => {
        setShowCursor(false)
      }, 2000)
    }
  }, [currentIndex, text, delay, initialDelay, isComplete, onComplete])

  // Cursor blinking effect
  useEffect(() => {
    if (cursor && !isComplete) {
      const cursorInterval = setInterval(() => {
        setShowCursor((prev) => !prev)
      }, 530) // Classic terminal cursor blink rate
      return () => clearInterval(cursorInterval)
    }
  }, [cursor, isComplete])

  return (
    <span className={className}>
      {displayedText}
      {cursor && showCursor && <span className="inline-block animate-pulse text-lightgreen-100">{cursorChar}</span>}
    </span>
  )
}

// Convenience component for multiple lines with sequential animation
interface TypewriterSequenceProps {
  lines: string[]
  delay?: number
  lineDelay?: number // Delay between lines
  className?: string
  lineClassName?: string
  onComplete?: () => void
}

export const TypewriterSequence: React.FC<TypewriterSequenceProps> = ({
  lines,
  delay = 40,
  lineDelay = 200,
  className = '',
  lineClassName = '',
  onComplete,
}) => {
  const [currentLine, setCurrentLine] = useState(0)
  const [completedLines, setCompletedLines] = useState<string[]>([])

  const handleLineComplete = () => {
    if (currentLine < lines.length - 1) {
      setCompletedLines([...completedLines, lines[currentLine]])
      setTimeout(() => {
        setCurrentLine(currentLine + 1)
      }, lineDelay)
    } else {
      setCompletedLines([...completedLines, lines[currentLine]])
      if (onComplete) {
        onComplete()
      }
    }
  }

  return (
    <div className={className}>
      {completedLines.map((line, index) => (
        <div key={index} className={lineClassName}>
          {line}
        </div>
      ))}
      {currentLine < lines.length && (
        <div className={lineClassName}>
          <TypewriterText
            text={lines[currentLine]}
            delay={delay}
            cursor={currentLine === lines.length - 1}
            onComplete={handleLineComplete}
          />
        </div>
      )}
    </div>
  )
}
