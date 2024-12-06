import { Button } from '@components/index'
import React, { FC } from 'react'
import Typewriter from 'typewriter-effect'

interface IEcosystemHead {}

const EcosystemHead: FC<IEcosystemHead> = () => {
  return (
    <section className="flex flex-col justify-center min-h-[85vh] pt-36 pb-5 items-center text-center text-[2.5rem] md:text-6xl leading-none text-white font-ocrx">
      <div className="container">
        <section className="self-stretch relative z-10 gap-[1.875rem] flex flex-col items-center text-center text-[2.5rem] md:text-6xl leading-none text-white font-ocrx">
          <div className="flex flex-col gap-[1.625rem]">
            <h1 className="m-0 max-w-[32.1rem] w-full text-inherit uppercase font-normal">
              Explore the <br /> Bitlazer{' '}
              <span className="inline-block text-lightgreen-100">
                <Typewriter
                  options={{
                    strings: ['ecosystem', 'ecosystem', 'ecosystem'],
                    autoStart: true,
                    loop: true,
                    deleteSpeed: 50,
                    delay: 100,
                  }}
                />
              </span>
            </h1>
            <div className="max-w-[32.131rem] relative text-[1.25rem] tracking-[-0.06em] leading-[1.625rem] font-maison-neue">
              The center of Bitlazer Dapps
            </div>
          </div>
          <div className="flex md:flex-row flex-col items-center gap-4 md:gap-[1.625rem] flex-wrap">
            <Button
              link="https://ga82o8jex7e.typeform.com/to/j9Otl7Fc"
              target="_blank"
              className="md:!w-auto min-w-[11.5rem]"
            >
              Add Your dapp
            </Button>
          </div>
        </section>
      </div>
    </section>
  )
}

export default EcosystemHead
