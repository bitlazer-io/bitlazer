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
    <div className="w-full min-h-screen relative overflow-hidden flex flex-col py-24">
      <div className="container">
        <div className="flex flex-col gap-6 md:pointer-events-auto md:[&_*]:pointer-events-auto">
          {/* Compact Header */}
          <div className="mb-2">
            <h1 className="text-3xl md:text-4xl font-ocrx text-lightgreen-100 tracking-[-0.06em] mb-1">
              <TypewriterText
                text="NETWORK STATS"
                delay={50}
                initialDelay={200}
                cursor={!titleComplete}
                cursorChar="▮"
                onComplete={() => setTitleComplete(true)}
              />
            </h1>
            <p className="text-base text-white font-maison-neue">
              {titleComplete && (
                <TypewriterText
                  text="Real-time metrics for the Bitlazer ecosystem"
                  delay={30}
                  initialDelay={100}
                  cursor={true}
                  cursorChar="_"
                />
              )}
            </p>
          </div>

          {/* Price Cards */}
          <PriceHeader />

          {/* Network Overview */}
          <NetworkOverview />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
