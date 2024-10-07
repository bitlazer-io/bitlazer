import { Loader, Header, Footer } from '@components/index'
import React, { Suspense, useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'

const MainLayout = () => {
  const linesRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    linesRef.current.forEach((line) => {
      const initialRotate = parseFloat(line.dataset.rotate || '0')
      const randomOffset = Math.random() * 4 - 2 // Случайное отклонение от -2 до 2 градусов
      line.style.setProperty('--initial-rotate', `${initialRotate}deg`)
      line.style.setProperty('--random-offset', `${randomOffset}deg`)
    })
  }, [])

  return (
    <div className="relative bg-black min-h-screen flex flex-col overflow-hidden ">
      <div className="w-full h-full absolute top-0 left-0">
        <div
          ref={(el) => el && linesRef.current.push(el)}
          className="w-[110vw] h-px left-0 top-[20.0331rem] absolute origin-top-left rotate-line"
          data-rotate="-17.62"
        >
          <div className="w-full h-full bg-[#68d861] absolute top-0 left-0"></div>
        </div>
        <div
          ref={(el) => el && linesRef.current.push(el)}
          className="w-[110vw] h-px left-[1.1987rem] top-[66.6394rem] absolute origin-top-left rotate-line"
          data-rotate="-6.96"
        >
          <div className="w-full h-full bg-[#68d861] absolute top-0 left-0"></div>
        </div>
        <div
          ref={(el) => el && linesRef.current.push(el)}
          className="w-[110vw] h-px left-[37.6rem] top-0 absolute origin-top-left rotate-line"
          data-rotate="37.45"
        >
          <div className="w-full h-full bg-[#68d861] absolute top-0 left-0"></div>
        </div>
        <div
          ref={(el) => el && linesRef.current.push(el)}
          className="w-[110vw] h-px left-0 top-[19.5562rem] absolute origin-top-left rotate-line"
          data-rotate="-7.18"
        >
          <div className="w-full h-full bg-[#68d861] absolute top-0 left-0"></div>
        </div>
        <div
          ref={(el) => el && linesRef.current.push(el)}
          className="w-[110vw] h-px left-0 md:left-[1.3313rem] top-[38.2575rem] absolute origin-top-left  rotate-line"
          data-rotate="8.23"
        >
          <div className="w-full h-full bg-[#68d861] absolute top-0 left-0"></div>
        </div>
      </div>
      <Suspense fallback={<Loader />}>
        <Header />
        <main className="relative z-20">
          <Outlet />
        </main>
        <Footer />
      </Suspense>
    </div>
  )
}

export default MainLayout
