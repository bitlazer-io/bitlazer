import React, { FC } from 'react'
import { Button } from '@components/index'
import Typewriter from 'typewriter-effect'

interface IHome {}

const Home: FC<IHome> = () => {
  return (
    <div className="w-full min-h-screen relative overflow-hidden flex flex-col justify-center md:py-28 py-32 pt-28">
      <div className="container">
        <section className="self-stretch relative z-10 gap-[1.875rem] flex flex-col items-center text-center text-[2.5rem] md:text-6xl leading-none text-white font-ocrx">
          <div className="flex flex-col gap-[1.625rem]">
            <h1 className="m-0 max-w-[32.1rem] w-full text-inherit uppercase font-normal">
              Lazer fast <br />
              Bitcoin{' '}
              <span className="inline-block text-lightgreen-100">
                <Typewriter
                  options={{
                    strings: ['network', 'earnings', 'future'],
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
