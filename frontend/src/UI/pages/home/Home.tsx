import React, { FC, useState, useEffect } from 'react'
import { Button } from '@components/index'
import Typewriter from 'typewriter-effect'

interface IHome {}

const Home: FC<IHome> = () => {
  const [glowAnimation, setGlowAnimation] = useState(false)

  useEffect(() => {
    // Start with glow animation active
    setGlowAnimation(true)
    // Trigger glow animation continuously
    const interval = setInterval(() => {
      setGlowAnimation(false)
      setTimeout(() => setGlowAnimation(true), 200)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex flex-col justify-center md:py-28 py-32 pt-28">
      <div className="container">
        {/* LZR Launch Announcement */}
        <div className="mb-8 md:mb-12 flex justify-center">
          <div className="relative group max-w-4xl w-full">
            <div
              className={`absolute inset-0 bg-gradient-to-r from-fuchsia/40 via-lightgreen-100/40 to-fuchsia/40 blur-3xl transition-all duration-1500 ${glowAnimation ? 'opacity-100 scale-110' : 'opacity-60 scale-100'}`}
            />
            <div className="relative bg-gradient-to-br from-black/95 via-darkslategray-200/95 to-black/95 backdrop-blur-sm border-2 border-lightgreen-100 p-4 md:p-6 rounded-[.115rem] hover:shadow-[0_0_40px_rgba(102,213,96,0.5)] transition-all duration-300">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="animate-pulse">
                    <div className="w-3 h-3 bg-lightgreen-100 rounded-full shadow-[0_0_15px_rgba(102,213,96,0.8)]" />
                  </div>
                  <span className="font-ocrx text-sm md:text-base text-fuchsia uppercase tracking-wider">
                    New Launch
                  </span>
                  <div className="animate-pulse">
                    <div className="w-3 h-3 bg-fuchsia rounded-full shadow-[0_0_15px_rgba(255,0,255,0.8)]" />
                  </div>
                </div>
                <h2 className="font-ocrx text-2xl md:text-4xl lg:text-5xl text-lightgreen-100 uppercase tracking-wide mb-3 leading-tight">
                  LZR Launching Soon
                  <br className="md:hidden" />
                  <span className="md:block"> on Arbitrum</span>
                </h2>
                <p className="font-maison-neue text-base md:text-lg text-white/90 max-w-2xl mx-auto">
                  Get ready for the next evolution of Bitcoin yield farming
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="self-stretch relative z-10 gap-[1.875rem] flex flex-col items-center text-center text-[2.5rem] md:text-6xl leading-none text-white font-ocrx">
          <div className="flex flex-col gap-[1.625rem]">
            <h1 className="m-0 max-w-[32.1rem] w-full text-inherit uppercase font-normal">
              Lazer fast <br />
              Bitcoin{' '}
              <span className="inline-block text-lightgreen-100">
                <Typewriter
                  options={{
                    strings: ['yield', 'staking', 'rewards', 'bridging'],
                    autoStart: true,
                    loop: true,
                    deleteSpeed: 50,
                    delay: 100,
                  }}
                />
              </span>
            </h1>
            <div className="max-w-[32.131rem] relative text-[1.25rem] tracking-[-0.06em] leading-[1.625rem] font-maison-neue">
              Supercharged Bitcoin yield with Layer 3 speed and ultra-low transaction fees
            </div>
          </div>
          <div className="flex md:flex-row flex-col items-center gap-4 md:gap-[1.625rem] flex-wrap">
            {/* <Button variant={'dark'} className="md:!w-auto min-w-[11.75rem]">
              LEARN MORE
            </Button> */}
            <Button link={'/bridge'} className="md:!w-auto min-w-[11.5rem]">
              BRIDGE & EARN
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Home
