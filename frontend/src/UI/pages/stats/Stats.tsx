import React, { FC, useState } from 'react'
import { PriceHeader } from '@components/stats/PriceHeader'
import { WrapStats } from '@components/stats/WrapStats'
import { BridgeStats } from '@components/stats/BridgeStats'
import { StakingStats } from '@components/stats/StakingStats'
import { NetworkOverview } from '@components/stats/NetworkOverview'
import { TypewriterText } from '@components/common/TypewriterText'

interface IStats {}

const Stats: FC<IStats> = () => {
  const [titleComplete, setTitleComplete] = useState(false)
  return (
    <div className="w-full min-h-screen relative overflow-hidden flex flex-col pt-20 pb-32 md:pt-28 md:pb-24">
      <div className="container px-4 md:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 md:gap-6 md:pointer-events-auto md:[&_*]:pointer-events-auto">
          {/* Compact Header */}
          <div className="mb-2">
            <h1 className="text-3xl md:text-6xl lg:text-7xl font-ocrx text-lightgreen-100 tracking-[-0.06em] mb-1">
              <TypewriterText
                text="NETWORK STATS"
                delay={50}
                initialDelay={200}
                cursor={!titleComplete}
                cursorChar="▮"
                onComplete={() => setTitleComplete(true)}
              />
            </h1>
            <p className="text-base md:text-xl text-white font-maison-neue min-h-[1.5rem] md:min-h-[1.75rem]">
              {titleComplete ? (
                <TypewriterText
                  text="Real-time metrics for the Bitlazer ecosystem"
                  delay={30}
                  initialDelay={100}
                  cursor={true}
                  cursorChar="_"
                />
              ) : (
                <span className="opacity-0">Real-time metrics for the Bitlazer ecosystem</span>
              )}
            </p>
          </div>

          {/* Price Cards */}
          <PriceHeader />

          {/* Network Overview */}
          <NetworkOverview />

          {/* Stats Grid */}
          <div className="w-full flex flex-col gap-4 md:gap-6">
            <WrapStats />
            <BridgeStats />
          </div>

          {/* Staking Section */}
          <StakingStats />
        </div>
      </div>
    </div>
  )
}

export default Stats
