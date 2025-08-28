import React, { FC } from 'react'
import clsx from 'clsx'
import { TransactionStage, TRANSACTION_STAGES, TransactionType } from '../../../types/transactions'

interface TransactionTimelineProps {
  type: TransactionType
  currentStage: TransactionStage
  className?: string
}

const TransactionTimeline: FC<TransactionTimelineProps> = ({ type, currentStage, className }) => {
  const stages = TRANSACTION_STAGES[type] || []
  const currentStageIndex = stages.findIndex((stage) => stage.stage === currentStage)

  return (
    <div className={clsx('w-full', className)}>
      <div className="relative">
        {/* Timeline Container */}
        <div className="flex items-center justify-between relative">
          {/* Progress Line - Full width background */}
          <div className="absolute left-6 right-6 top-1/2 transform -translate-y-1/2 h-1 bg-white/20" />

          {/* Progress Line - Filled portion */}
          <div
            className="absolute left-6 top-1/2 transform -translate-y-1/2 h-1 bg-lightgreen-100 transition-all duration-500"
            style={{
              width:
                stages.length > 1
                  ? `calc(${(currentStageIndex / (stages.length - 1)) * 100}% * (100% - 48px) / 100%)`
                  : '0%',
            }}
          />

          {/* Stage Circles */}
          {stages.map((stageInfo, index) => {
            const isCompleted = index < currentStageIndex
            const isCurrent = index === currentStageIndex
            const isPending = index > currentStageIndex

            return (
              <div key={stageInfo.stage} className="flex flex-col items-center relative z-10 flex-1">
                {/* Circle Container */}
                <div
                  className={clsx(
                    'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300',
                    {
                      'bg-lightgreen-100': isCompleted,
                      'bg-lightgreen-100/20 border-2 border-lightgreen-100': isCurrent,
                      'bg-black border-2 border-white/30': isPending,
                    },
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : isCurrent ? (
                    <div className="w-5 h-5 bg-lightgreen-100 rounded-full animate-pulse" />
                  ) : (
                    <div className="w-4 h-4 bg-white/20 rounded-full" />
                  )}
                </div>

                {/* Label Below Circle */}
                <div className="mt-2 text-center absolute top-full">
                  <div
                    className={clsx('text-[11px] font-medium transition-colors whitespace-nowrap', {
                      'text-lightgreen-100': isCompleted || isCurrent,
                      'text-white/50': isPending,
                    })}
                  >
                    {stageInfo.label}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Spacing for labels */}
        <div className="h-8" />
      </div>

      {/* Current Stage Description */}
      {currentStageIndex >= 0 && stages[currentStageIndex] && (
        <div className="mt-4 text-center">
          <p className="text-xs text-white/50">{stages[currentStageIndex].description}</p>
        </div>
      )}
    </div>
  )
}

export default TransactionTimeline
